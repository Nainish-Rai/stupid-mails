import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface EmailContent {
  id?: string; // Optional email ID if it exists in the database
  sender: string;
  subject: string;
  content: string;
  email_date: string;
}

interface ClassificationResult {
  classification: string;
  reason: string;
  confidence?: number;
}

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

// POST /api/gmail/emails/classify/batch - Classify multiple emails with provided content
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
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: "Valid email array is required",
            code: "INVALID_REQUEST",
          },
        },
        { status: 400 }
      );
    }

    // Get user's classification preferences/custom prompt
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { customPrompt: true },
    });

    // Fix: Ensure customPrompt is a string or undefined (not null)
    const customPrompt = userPrefs?.customPrompt || undefined;

    // Process emails in sequence to avoid rate limiting
    const results = [];
    for (const email of emails) {
      try {
        if (!email.sender || !email.subject || !email.content) {
          results.push({
            input: email,
            error: "Missing required email fields",
            success: false,
          });
          continue;
        }

        // Classify the email using the provided content
        const classification = await classifyEmailContent(email, customPrompt);

        // If email ID is provided and exists in the database, update classification
        if (email.id) {
          const existingEmail = await prisma.email.findUnique({
            where: {
              userId_gmailId: {
                userId: user.id,
                gmailId: email.id,
              },
            },
          });

          if (existingEmail) {
            // Store classification in database
            await prisma.emailClassification.upsert({
              where: {
                emailId_userId: { emailId: email.id, userId: user.id },
              },
              update: {
                category: classification.classification,
                confidence: classification.confidence || 0.8,
                reason: classification.reason,
                classifiedAt: new Date(),
              },
              create: {
                id: `${email.id}_${user.id}_${Date.now()}`,
                emailId: email.id,
                userId: user.id,
                category: classification.classification,
                confidence: classification.confidence || 0.8,
                reason: classification.reason,
                classifiedAt: new Date(),
              },
            });

            // Update email record
            await prisma.email.update({
              where: {
                userId_gmailId: {
                  userId: user.id,
                  gmailId: email.id,
                },
              },
              data: {
                category: classification.classification,
                categoryConfidence: classification.confidence || 0.8,
              },
            });
          }
        }

        results.push({
          input: {
            sender: email.sender,
            subject: email.subject,
            date: email.email_date,
          },
          classification: classification.classification,
          reason: classification.reason,
          confidence: classification.confidence || 0.8,
          success: true,
        });
      } catch (error) {
        console.error(`Error classifying email:`, error);
        results.push({
          input: {
            sender: email.sender,
            subject: email.subject,
            date: email.email_date,
          },
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

// Function to classify an email based on its content
async function classifyEmailContent(
  email: EmailContent,
  customPrompt?: string
): Promise<ClassificationResult> {
  try {
    // Use the provided custom prompt or fall back to default prompt
    const DEFAULT_PROMPT = `Please classify this email as either:

ATTN: emails that are clearly from a real person that wanted to reach out to me for a specific reason. you can also place high value notifcations here/ time sensitive.
FK-U: a special place in hell is for these people. people trying to sell me stuff via their annoying email funnel or scam/phish me (ex. "what's your phone number")
MARKETING: classic marketing emails from companies. safe to ignore type stuff. stuff like ny times/bloomberg type stuff fits in here.
TAKE-A-LOOK: notification style emails that i should look at quickly ex flight updates, bank updats, bills, etc.
HMMMM: if you really aren't sure where to put it. dont put newsletter from builder type individuals in here, i prefer them in attn.

From: {sender}
Subject: {subject}
Content: {content}
Date Sent: {email_date}

Provide your classification and a brief explanation why in JSON format:
{{"classification": "ATTN/FK-U/MARKETING/TAKE-A-LOOK/HMMMM", "reason": "your explanation here"}}`;

    // Use the prompt template to build the full prompt
    const prompt = customPrompt || DEFAULT_PROMPT;

    // Format the email content for classification
    const formattedContent = `From: ${email.sender}
Subject: ${email.subject}
Content: ${email.content}
Date Sent: ${email.email_date || new Date().toISOString()}`;

    // Call OpenAI API for classification
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile", // or other model as configured
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: formattedContent,
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
      classification: "HMMMM",
      reason:
        "Classification failed: " +
        (error instanceof Error ? error.message : String(error)),
      confidence: 0,
    };
  }
}
