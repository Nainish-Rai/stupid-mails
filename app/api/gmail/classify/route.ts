import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

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

    const chatCompletion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-preview-04-17",
      messages: [
        {
          role: "system",
          content: `You are an email classifier. You will receive a list of emails and must return a JSON object mapping email IDs to their classifications.

Classification Categories:
ATTN: emails that are clearly from a real person that wanted to reach out to me for a specific reason. you can also place high value notifcations here/ time sensitive.
FK-U: a special place in hell is for these people. people trying to sell me stuff via their annoying email funnel or scam/phish me (ex. "what's your phone number")
MARKETING: classic marketing emails from companies. safe to ignore type stuff. stuff like ny times/bloomberg type stuff fits in here.
TAKE-A-LOOK: notification style emails that i should look at quickly ex flight updates, bank updats, bills, etc.
HMMMM: if you really aren't sure where to put it. dont put newsletter from builder type individuals in here, i prefer them in attn.

Classification Rules:
- Personal message from friend or colleagues → ATTN
- Tech feature announcements <14 days old → TAKE-A-LOOK
- Tech feature announcements >14 days old → MARKETING
- Mass outreach/sales pitches → FK-U
- Service notifications (banking, flights) → TAKE-A-LOOK
- News/world updates → MARKETING
- Impersonal outreach → FK-U

Some context on my preferences:
- i dont care for news type emails/world updates.
- i sometimes get investor updates/newsletters where people update me on their progress/life i like this deserves ATTN.
- i get a lot of random builders/founders hit me up. i love that! but hate when its obviously no a personalized email to me. if unsure drop in HMMMM. its okay if these emails are 90+ days old. its better to reply to them vs not reply.
- i like to read breif emails on an ai/ tech companies latest feature (ex. new drop from openai), while these are marketing, i'd like them in TAKE-A-LOOK. but, if this type of email is 14+ days old just put it in MARKETING.
- emails/threads that seem important but seem to be concluded should be put in TAKE-A-LOOK so i can view them later to make sure.
- Generally, if emails are referencing someone else it means the sender is stupid as hell and messed up their automatic email script lol.

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
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from AI");
    }

    const classifications = JSON.parse(content) as Record<
      string,
      ClassificationResponse
    >;
    return new Map(Object.entries(classifications));
  } catch (error) {
    console.error("Error in AI call:", error);
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

      const classificationsMap = await classifyEmails(emails);

      const classifiedEmails = emails
        .filter((email: EmailData) => classificationsMap.has(email.id))
        .map((email: EmailData) => ({
          ...email,
          classification: classificationsMap.get(email.id),
        }));

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
        take: 20,
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
