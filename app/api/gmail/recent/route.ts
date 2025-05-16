import { createGmailClientForUser } from "@/lib/gmail";
import { GmailMessage } from "@/lib/gmail-types";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

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

// Email content cleaning function based on the provided Python reference
function cleanEmailContent(text: string): string {
  // Remove style and script tags and their contents
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");

  // Remove image tags but keep alt text
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, "$1");
  text = text.replace(/<img[^>]*>/g, "");

  // Remove common marketing/footer patterns
  const patternsToRemove = [
    /Copyright ©.*?(?=\n|$)/gi,
    /You are receiving this email because.*?(?=\n|$)/gi,
    /To connect with us.*?(?=\n|$)/gi,
    /Our mailing address.*?(?=\n|$)/gi,
    /Unsubscribe.*?(?=\n|$)/gi,
    /Add .* to your address book.*?(?=\n|$)/gi,
  ];

  for (const pattern of patternsToRemove) {
    text = text.replace(pattern, "");
  }

  // Remove HTML attributes that don't affect content
  text = text.replace(/style="[^"]*"/g, "");
  text = text.replace(/class="[^"]*"/g, "");
  text = text.replace(/width="[^"]*"/g, "");
  text = text.replace(/height="[^"]*"/g, "");
  text = text.replace(/align="[^"]*"/g, "");

  // Remove URLs and base64 images while preserving link text
  text = text.replace(/<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/g, "$1");
  text = text.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/]+=*/g, "");

  // Remove remaining HTML tags but preserve their content
  text = text.replace(/<[^>]+>/g, " ");

  // Clean up whitespace while preserving email quote structure
  text = text.replace(/ +/g, " "); // Multiple spaces to single space
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n"); // Multiple blank lines to double line

  // Preserve common quote markers
  text = text.replace(/^\s*>+\s*/gm, "> "); // Standardize quote markers

  // Better quote handling - collapse multiple '>' into single '>'
  const lines = text.split("\n");
  const cleanedLines = [];
  for (const line of lines) {
    // If line starts with multiple '>', reduce to single '>'
    if (line.trim().startsWith(">")) {
      // Remove extra spaces around '>' symbols
      let cleanedLine = line.replace(/\s*>\s*>\s*/g, "> ");
      // Ensure only one '>' at start with one space after
      cleanedLine = cleanedLine.replace(/^\s*>+\s*/g, "> ");
      cleanedLines.push(cleanedLine);
    } else {
      cleanedLines.push(line);
    }
  }

  text = cleanedLines.join("\n");

  // Clean up any remaining multiple blank lines
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return text.trim();
}

// Helper to extract email content from Gmail message
async function extractEmailContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gmailClient: any,
  email: GmailMessage
): Promise<string> {
  try {
    // Fetch the full email to get content
    const fullEmail = await gmailClient.getEmail(email.id);
    let content = "";

    // Extract content from payload
    if (fullEmail.payload?.body?.data) {
      // Decode base64 content
      content = Buffer.from(fullEmail.payload.body.data, "base64").toString(
        "utf-8"
      );
    } else if (fullEmail.payload?.parts) {
      // Search through parts for text content
      for (const part of fullEmail.payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          content = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        } else if (
          part.mimeType === "text/html" &&
          part.body?.data &&
          !content
        ) {
          // Use HTML content if no plain text is found
          content = Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
    }

    return content;
  } catch (error) {
    console.error("Error extracting email content:", error);
    return "";
  }
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

    // Fetch recent emails
    const response = await gmailClient.listEmails({
      maxResults: 100,
    });

    // Process emails and return with content (no DB saving)
    const processedEmails = await Promise.all(
      response.emails.map(async (email: GmailMessage) => {
        const metadata = gmailClient.parseEmailMetadata(email);

        // Get the full email content
        const rawContent = await extractEmailContent(gmailClient, email);

        // Clean the content
        const cleanedContent = cleanEmailContent(rawContent);

        // Return normalized email data with content
        return {
          id: email.id,
          threadId: email.threadId,
          subject: metadata.subject,
          snippet: email.snippet,
          sender: metadata.sender,
          receivedAt: metadata.receivedAt.toISOString(),
          isRead: metadata.isRead,
          labelIds: email.labelIds,
          content: cleanedContent,
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
