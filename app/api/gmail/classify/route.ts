import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Groq } from "groq-sdk";
import { prisma } from "@/lib/prisma";

const groq = new Groq();
const RECENT_EMAILS_URL = "http://localhost:3000/api/gmail/important";

interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  sender: string;
  receivedAt: string;
  isRead: boolean;
  labelIds: string[];
  content: string;
  summary?: string;
}

interface ClassificationResponse {
  classification: string;
  reason: string;
}

async function classifyEmails(
  emails: EmailData[]
): Promise<Map<string, ClassificationResponse>> {
  try {
    const emailsData = emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      content: email.content,
      sender: email.sender,
      receivedAt: email.receivedAt,
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an email classifier. You will receive a list of emails and must return a JSON object mapping email IDs to their classifications.

Classification Categories:
1. ATTN: Personal emails and time-sensitive notifications
2. FK-U: Sales funnel emails and scams
3. MARKETING: Company newsletters and general updates
4. TAKE-A-LOOK: Important service notifications
5. HMMMM: Uncertain cases

Classification Rules:
- Personal newsletters/investor updates → ATTN
- Tech feature announcements <14 days old → TAKE-A-LOOK
- Tech feature announcements >14 days old → MARKETING
- Mass outreach/sales pitches → FK-U
- Service notifications (banking, flights) → TAKE-A-LOOK
- News/world updates → MARKETING
- Personalized builder outreach → ATTN
- Impersonal outreach → FK-U

REQUIRED OUTPUT FORMAT:
{
  "email_id": {
    "classification": "one of: ATTN/FK-U/MARKETING/TAKE-A-LOOK/HMMMM",
    "reason": "brief explanation"
  },
  // repeat for each email
}`,
        },
        {
          role: "user",
          content: JSON.stringify(emailsData),
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      top_p: 0.95,
      stream: false,
      response_format: {
        type: "json_object",
      },
    });

    const content = chatCompletion.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from Groq AI");
    }

    const classifications = JSON.parse(content) as Record<
      string,
      ClassificationResponse
    >;
    return new Map(Object.entries(classifications));
  } catch (error) {
    console.error("Error in Groq AI call:", error);
    throw new Error("Failed to classify emails");
  }
}

interface RecentEmailsResponse {
  emails: EmailData[];
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

    // If mode=fetch is provided in the URL, fetch and classify new emails
    // Otherwise, return existing classified emails from the database
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");

    if (mode === "fetch") {
      const recentEmailsResponse = await fetch(RECENT_EMAILS_URL, {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      });

      if (!recentEmailsResponse.ok) {
        const error = await recentEmailsResponse.json();
        return NextResponse.json(error, {
          status: recentEmailsResponse.status,
        });
      }

      const { emails } =
        (await recentEmailsResponse.json()) as RecentEmailsResponse;

      // Get the classification map
      const classificationsMap = await classifyEmails(emails);

      // Filter and enhance emails with classifications
      const classifiedEmails = emails
        .filter((email: EmailData) => classificationsMap.has(email.id))
        .map((email: EmailData) => ({
          ...email,
          classification: classificationsMap.get(email.id),
        }));

      // Save to database (using upsert to avoid duplicates)
      for (const email of classifiedEmails) {
        await prisma.classifiedEmail.upsert({
          where: { id: email.id },
          update: {
            classificationType: email.classification?.classification,
            classificationReason: email.classification?.reason,
          },
          create: {
            id: email.id,
            threadId: email.threadId,
            subject: email.subject,
            snippet: email.snippet,
            sender: email.sender,
            receivedAt: new Date(email.receivedAt),
            isRead: email.isRead,
            labelIds: email.labelIds,
            content: email.content,
            classificationType: email.classification?.classification,
            classificationReason: email.classification?.reason,
            userId: user.id,
          },
        });
      }

      return NextResponse.json({
        emails: classifiedEmails,
      });
    } else {
      // Get classified emails for the current user
      const classifiedEmails = await prisma.classifiedEmail.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          receivedAt: "desc",
        },
        select: {
          id: true,
          subject: true,
          snippet: true,
          sender: true,
          receivedAt: true,
          isRead: true,
          classificationType: true,
          classificationReason: true,
        },
        take: 20, // Limit to 20 emails for performance
      });

      return NextResponse.json({
        emails: classifiedEmails,
      });
    }
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        error: {
          message: err.message || "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
