import { GmailMessage } from "./gmail-types";
import { OpenAI } from "openai";
import { prisma } from "./prisma";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Extracts email content suitable for classification
export function extractEmailContent(message: GmailMessage): string {
  let content = "";

  // Extract subject from headers
  const subject =
    message.payload?.headers?.find(
      (header) => header.name.toLowerCase() === "subject"
    )?.value || "";

  // Extract sender from headers
  const from =
    message.payload?.headers?.find(
      (header) => header.name.toLowerCase() === "from"
    )?.value || "";

  // Extract body content from message parts
  if (message.payload?.body?.data) {
    // Decode base64 content
    content = Buffer.from(message.payload.body.data, "base64").toString(
      "utf-8"
    );
  } else if (message.payload?.parts) {
    // Search through parts for text content
    for (const part of message.payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        content = Buffer.from(part.body.data, "base64").toString("utf-8");
        break;
      }
    }
  }

  // Clean content (remove excess whitespace, HTML, footers, etc.)
  content = cleanEmailContent(content);

  return `From: ${from}\nSubject: ${subject}\n\nContent:\n${content}`;
}

// Cleans email content by removing HTML, signatures, etc.
function cleanEmailContent(content: string): string {
  // Basic HTML tag removal
  let cleanedContent = content.replace(/<[^>]*>/g, " ");

  // Remove excessive whitespace
  cleanedContent = cleanedContent.replace(/\s+/g, " ").trim();

  // Remove common email footers and marketing content
  // This could be expanded with more sophisticated patterns
  const footerPatterns = [
    /Unsubscribe\s*\|/i,
    /To stop receiving/i,
    /View this email in your browser/i,
    /This email was sent to/i,
    /Copyright © \d{4}/i,
    /All Rights Reserved/i,
    /Contact us at/i,
    /Please do not reply/i,
  ];

  for (const pattern of footerPatterns) {
    const match = cleanedContent.match(pattern);
    if (match && match.index) {
      cleanedContent = cleanedContent.substring(0, match.index).trim();
    }
  }

  return cleanedContent;
}

// Main classification function
export async function classifyEmail(
  email: GmailMessage,
  userId: string,
  customPrompt?: string // Changed from classificationPrompt to customPrompt
): Promise<{
  classification: string;
  reason: string;
  confidence: number;
}> {
  try {
    // Get user's classification preferences
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId },
      select: { customPrompt: true },
    });

    // Use provided prompt or default to user's prompt or system prompt
    const prompt =
      customPrompt || userPrefs?.customPrompt || DEFAULT_CLASSIFICATION_PROMPT;

    // Prepare email content
    const emailContent = extractEmailContent(email);

    // Call OpenAI API for classification
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile", // or "gpt-3.5-turbo" for cost savings
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: emailContent,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 150, // Limit token usage
      response_format: { type: "json_object" },
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    if (!result.classification) {
      throw new Error("Invalid classification response from AI");
    }

    return {
      classification: result.classification,
      reason: result.reason || "No reason provided",
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    console.error("Classification error:", error);
    // Return a default classification for failed attempts
    return {
      classification: "INBOX",
      reason:
        "Classification failed: " +
        (error instanceof Error ? error.message : String(error)),
      confidence: 0,
    };
  }
}

// Store classification result in database
export async function storeClassification(
  emailId: string,
  userId: string,
  result: { classification: string; reason: string; confidence: number }
) {
  return prisma.emailClassification.upsert({
    where: {
      emailId_userId: { emailId, userId },
    },
    update: {
      category: result.classification,
      confidence: result.confidence,
      reason: result.reason,
      classifiedAt: new Date(),
    },
    create: {
      emailId,
      userId,
      category: result.classification,
      confidence: result.confidence,
      reason: result.reason,
      classifiedAt: new Date(),
    },
  });
}

// Default classification prompt
const DEFAULT_CLASSIFICATION_PROMPT = `
You are an AI assistant that helps classify emails into categories.
Analyze the email content, subject, and sender to determine the most appropriate category.

Categories:
- ATTN: Urgent emails requiring immediate attention
- FK-U: Spam, scams, or unwanted communications
- MARKETING: Promotional emails and newsletters
- TAKE-A-LOOK: Non-urgent but potentially interesting or useful emails
- HMMMM: Emails that are ambiguous or need more context to categorize

Provide your classification and a brief explanation why in JSON format:
{"classification": "ATTN/FK-U/MARKETING/TAKE-A-LOOK/HMMMM", "reason": "your explanation here", "confidence": 0.0-1.0}`;
