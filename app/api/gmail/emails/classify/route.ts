import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createGmailClientForUser } from "@/lib/gmail";
import { classifyEmail, storeClassification } from "@/lib/classification";
import { prisma } from "@/lib/prisma";

// Helper to handle errors consistently
function handleApiError(error: Error & { code?: string }) {
  console.error("Email classification error:", error);
  const message =
    error.message || "Something went wrong with email classification";
  const code = error.code || "UNKNOWN_ERROR";

  return NextResponse.json(
    { error: { message, code } },
    { status: error.code === "UNAUTHORIZED" ? 401 : 500 }
  );
}

// POST /api/gmail/emails/classify - Classify a single email
export async function POST(request: NextRequest) {
  try {
    // Get user from auth session
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Parse request body
    const { emailId } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { error: { message: "Email ID is required", code: "INVALID_REQUEST" } },
        { status: 400 }
      );
    }

    // Create Gmail client
    const gmailClient = await createGmailClientForUser(user.id);
    if (!gmailClient) {
      return NextResponse.json(
        {
          error: {
            message: "Gmail account not connected",
            code: "GMAIL_NOT_CONNECTED",
          },
        },
        { status: 400 }
      );
    }

    // Fetch the email content
    const email = await gmailClient.getEmail(emailId);

    // Get user's classification preferences
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { customPrompt: true },
    });

    // Classify the email
    const classification = await classifyEmail(
      email,
      user.id,
      userPrefs?.customPrompt || undefined
    );

    // Store the classification result
    await storeClassification(emailId, user.id, classification);

    // Update the email record with the classification
    await prisma.email.update({
      where: {
        userId_gmailId: {
          userId: user.id,
          gmailId: emailId,
        },
      },
      data: {
        category: classification.classification,
        categoryConfidence: classification.confidence,
      },
    });

    return NextResponse.json({
      success: true,
      emailId,
      classification: classification.classification,
      reason: classification.reason,
      confidence: classification.confidence,
    });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}

// GET /api/gmail/emails/classify/batch - Classify multiple emails in batch
export async function GET(request: NextRequest) {
  try {
    // Get user from auth session
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Get batch size from query params (default to 10)
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get("batchSize") || "10", 10);
    const onlyNew = searchParams.get("onlyNew") === "true";

    // Find unclassified emails
    const emailsToClassify = await prisma.email.findMany({
      where: {
        userId: user.id,
        ...(onlyNew ? { category: null } : {}),
      },
      orderBy: { receivedAt: "desc" },
      take: batchSize,
      select: { gmailId: true },
    });

    if (emailsToClassify.length === 0) {
      return NextResponse.json({ message: "No emails to classify" });
    }

    // Create Gmail client
    const gmailClient = await createGmailClientForUser(user.id);
    if (!gmailClient) {
      return NextResponse.json(
        {
          error: {
            message: "Gmail account not connected",
            code: "GMAIL_NOT_CONNECTED",
          },
        },
        { status: 400 }
      );
    }

    // Process emails in sequence to avoid rate limiting
    const results = [];
    for (const emailItem of emailsToClassify) {
      try {
        // Fetch full email content
        const email = await gmailClient.getEmail(emailItem.gmailId);

        // Classify the email
        const classification = await classifyEmail(email, user.id);

        // Store classification result
        await storeClassification(emailItem.gmailId, user.id, classification);

        // Update email record
        await prisma.email.update({
          where: {
            userId_gmailId: {
              userId: user.id,
              gmailId: emailItem.gmailId,
            },
          },
          data: {
            category: classification.classification,
            categoryConfidence: classification.confidence,
          },
        });

        results.push({
          emailId: emailItem.gmailId,
          classification: classification.classification,
          success: true,
        });
      } catch (error) {
        console.error(`Error classifying email ${emailItem.gmailId}:`, error);
        results.push({
          emailId: emailItem.gmailId,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}
