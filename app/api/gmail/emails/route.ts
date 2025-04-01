import { createGmailClientForUser } from "@/lib/gmail";
import { GmailMessage } from "@/lib/gmail-types";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to handle errors consistently
function handleApiError(error: Error & { code?: string }) {
  console.error("Gmail API error:", error);
  const message = error.message || "Something went wrong with the Gmail API";
  const code = error.code || "UNKNOWN_ERROR";

  return NextResponse.json(
    { error: { message, code } },
    { status: error.code === "UNAUTHORIZED" ? 401 : 500 }
  );
}

// GET /api/gmail/emails - Fetch emails with pagination
export async function GET(request: NextRequest) {
  try {
    // Get user from Better Auth session
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const maxResults = searchParams.get("maxResults")
      ? parseInt(searchParams.get("maxResults")!)
      : 50;
    const pageToken = searchParams.get("pageToken") || undefined;
    const labelIds = searchParams.get("labelIds")
      ? searchParams.get("labelIds")!.split(",")
      : undefined;
    const q = searchParams.get("q") || undefined;

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

    // Fetch emails
    const response = await gmailClient.listEmails({
      maxResults,
      pageToken,
      labelIds,
      q,
    });

    // Process emails to save to database and return normalized format
    const processedEmails = await Promise.all(
      response.emails.map(async (email: GmailMessage) => {
        const metadata = gmailClient.parseEmailMetadata(email);

        // Check if email already exists in database
        const existingEmail = await prisma.email.findUnique({
          where: { gmailId: email.id },
        });

        if (!existingEmail) {
          // Save new email to database
          await prisma.email.create({
            data: {
              gmailId: email.id,
              subject: metadata.subject,
              snippet: email.snippet,
              sender: metadata.sender,
              receivedAt: metadata.receivedAt,
              isRead: metadata.isRead,
              userId: user.id,
            },
          });
        }

        // Return normalized email data
        return {
          id: email.id,
          threadId: email.threadId,
          subject: metadata.subject,
          snippet: email.snippet,
          sender: metadata.sender,
          receivedAt: metadata.receivedAt.toISOString(),
          isRead: metadata.isRead,
          labelIds: email.labelIds,
        };
      })
    );

    return NextResponse.json({
      emails: processedEmails,
      nextPageToken: response.nextPageToken,
    });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}

// POST /api/gmail/sync - Trigger email sync
export async function POST(request: NextRequest) {
  try {
    // Get user from Better Auth session
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
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

    // Get user profile to get total messages
    const profile = await gmailClient.getUserProfile();

    // Create a processing stats record
    const batchId = `sync-${Date.now()}`;
    const processingStats = await prisma.processingStats.create({
      data: {
        batchId,
        startTime: new Date(),
        emailsProcessed: 0,
        successCount: 0,
        errorCount: 0,
        status: "PROCESSING",
        userId: user.id,
      },
    });

    // In a real implementation, this would be a background job
    // For now, we'll start the sync process here but limit to a small batch

    // Fetch latest emails (limit to 100 for this example)
    const response = await gmailClient.listEmails({
      maxResults: 100,
    });

    let successCount = 0;
    let errorCount = 0;

    // Process and save emails
    for (const email of response.emails) {
      try {
        const metadata = gmailClient.parseEmailMetadata(email);

        // Upsert email to ensure we don't create duplicates
        await prisma.email.upsert({
          where: { gmailId: email.id },
          update: {
            subject: metadata.subject,
            snippet: email.snippet,
            sender: metadata.sender,
            receivedAt: metadata.receivedAt,
            isRead: metadata.isRead,
          },
          create: {
            gmailId: email.id,
            subject: metadata.subject,
            snippet: email.snippet,
            sender: metadata.sender,
            receivedAt: metadata.receivedAt,
            isRead: metadata.isRead,
            userId: user.id,
          },
        });

        successCount++;
      } catch (error) {
        console.error("Error processing email:", error);
        errorCount++;
      }
    }

    // Update the processing stats
    await prisma.processingStats.update({
      where: { id: processingStats.id },
      data: {
        endTime: new Date(),
        emailsProcessed: response.emails.length,
        successCount,
        errorCount,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      status: "success",
      processed: response.emails.length,
      total: profile.messagesTotal,
      batchId,
    });
  } catch (error) {
    console.error("API error:", error);
    return handleApiError(error as Error & { code?: string });
  }
}
