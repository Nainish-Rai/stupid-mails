import { createGmailClientForUser } from "@/lib/gmail";
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

// GET /api/gmail/labels - List all labels
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

    // Fetch labels from Gmail API
    const gmailLabels = await gmailClient.listLabels();

    // Sync with our database
    for (const gmailLabel of gmailLabels) {
      // Check if label exists in our database
      const existingLabel = await prisma.label.findFirst({
        where: {
          userId: user.id,
          gmailLabelId: gmailLabel.id,
        },
      });

      if (!existingLabel) {
        // Create new label in our database
        await prisma.label.create({
          data: {
            name: gmailLabel.name,
            gmailLabelId: gmailLabel.id,
            color: gmailLabel.color
              ? `${gmailLabel.color.backgroundColor}|${gmailLabel.color.textColor}`
              : null,
            isDefault: gmailLabel.type === "system",
            userId: user.id,
          },
        });
      }
    }

    // Get all labels from our database
    const labels = await prisma.label.findMany({
      where: {
        userId: user.id,
      },
    });

    // Map database labels to response format
    const mappedLabels = labels.map((label) => {
      let backgroundColor, textColor;

      if (label.color) {
        const [bg, text] = label.color.split("|");
        backgroundColor = bg;
        textColor = text;
      }

      return {
        id: label.id,
        name: label.name,
        gmailLabelId: label.gmailLabelId,
        color: label.color ? { backgroundColor, textColor } : null,
        isDefault: label.isDefault,
        description: label.description,
      };
    });

    return NextResponse.json({ labels: mappedLabels });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}
