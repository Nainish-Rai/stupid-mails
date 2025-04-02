import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createGmailClientForUser } from "@/lib/gmail";
// Helper to extract email body content from Gmail message
function extractEmailContent(message: any): string {
  if (!message || !message.payload) {
    return "";
  }

  // Check if this is a plain text or HTML email
  if (message.payload.body && message.payload.body.data) {
    // Direct content in the main payload
    return decodeBase64(message.payload.body.data);
  }

  // For multipart emails, we need to traverse the parts
  if (message.payload.parts && message.payload.parts.length > 0) {
    // First try to find HTML content
    const htmlPart = message.payload.parts.find(
      (part: any) => part.mimeType === "text/html"
    );
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      return decodeBase64(htmlPart.body.data);
    }

    // If no HTML, look for plain text
    const textPart = message.payload.parts.find(
      (part: any) => part.mimeType === "text/plain"
    );
    if (textPart && textPart.body && textPart.body.data) {
      return decodeBase64(textPart.body.data);
    }

    // If still not found, recursively check for nested parts
    for (const part of message.payload.parts) {
      if (part.parts && part.parts.length > 0) {
        const nestedContent = extractContentFromParts(part.parts);
        if (nestedContent) {
          return nestedContent;
        }
      }
    }
  }

  // Fallback to snippet if nothing else
  return message.snippet || "";
}

// Helper to extract content from nested parts
function extractContentFromParts(parts: any[]): string | null {
  // First try to find HTML content
  const htmlPart = parts.find((part) => part.mimeType === "text/html");
  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    return decodeBase64(htmlPart.body.data);
  }

  // If no HTML, look for plain text
  const textPart = parts.find((part) => part.mimeType === "text/plain");
  if (textPart && textPart.body && textPart.body.data) {
    return decodeBase64(textPart.body.data);
  }

  // Recursively check nested parts
  for (const part of parts) {
    if (part.parts && part.parts.length > 0) {
      const nestedContent = extractContentFromParts(part.parts);
      if (nestedContent) {
        return nestedContent;
      }
    }
  }

  return null;
}

// Helper to decode base64 encoded content
function decodeBase64(data: string): string {
  try {
    // Replace URL-safe characters and add padding if needed
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");

    const paddedData = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    // Decode from base64 and then from URL encoding
    const decoded = Buffer.from(paddedData, "base64").toString("utf-8");
    return decoded;
  } catch (error) {
    console.error("Error decoding email content:", error);
    return "";
  }
}

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

// GET /api/gmail/emails/[id]/content - Get full content of a specific email
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get email ID from route params
    const emailId = params.id;
    if (!emailId) {
      return NextResponse.json(
        {
          error: {
            message: "Email ID is required",
            code: "MISSING_EMAIL_ID",
          },
        },
        { status: 400 }
      );
    }

    // Get current user
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

    // Fetch the full email content
    const email = await gmailClient.getEmail(emailId);
    if (!email) {
      return NextResponse.json(
        {
          error: {
            message: "Email not found",
            code: "EMAIL_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Extract email content
    const content = extractEmailContent(email);
    const metadata = gmailClient.parseEmailMetadata(email);

    // Return the email content and basic metadata
    return NextResponse.json({
      id: email.id,
      threadId: email.threadId,
      subject: metadata.subject,
      sender: metadata.sender,
      receivedAt: metadata.receivedAt.toISOString(),
      content,
      snippet: email.snippet,
    });
  } catch (error) {
    return handleApiError(error as Error & { code?: string });
  }
}
