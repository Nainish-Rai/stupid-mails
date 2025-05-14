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

export async function GET(request: NextRequest) {
  try {
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

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's emails
    const response = await gmailClient.listEmails({
      maxResults: 50,
      q: `after:${Math.floor(today.getTime() / 1000)}`,
    });

    // Process emails and save to database
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
    });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}
