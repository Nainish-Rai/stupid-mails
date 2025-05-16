import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const RECENT_EMAILS_URL = "http://localhost:3000/api/gmail/recent";

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

interface GroqResponse {
  important_emails: Array<{
    id: string;
    summary: string;
  }>;
}

async function analyzeEmails(emails: EmailData[]): Promise<GroqResponse> {
  try {
    const emailsData = emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      snippet: email.snippet,
      sender: email.sender,
      content: email.content,
      receivedAt: email.receivedAt,
      isRead: email.isRead,
      labelIds: email.labelIds,
    }));

    const chatCompletion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-preview-04-17",
      messages: [
        {
          role: "system",
          content: `You are an email analyzer that:
1. Selects the top 20 most important emails based on urgency, sender credibility, content relevance, and time sensitivity
2. You should ignore the marketing emails and other non-urgent emails from saas or services until they are important.
3. Creates a brief, actionable summary for each selected email, It should use casual witty and funny language strictly use genz language.
Return only a JSON object with array 'important_emails' containing objects with 'id' and 'summary' fields.`,
        },
        {
          role: "user",
          content: JSON.stringify(emailsData),
        },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from AI");
    }

    const result = JSON.parse(content) as GroqResponse;
    return result;
  } catch (error) {
    console.error("Error in AI call:", error);
    throw new Error("Failed to analyze emails");
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

    const recentEmailsResponse = await fetch(RECENT_EMAILS_URL, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!recentEmailsResponse.ok) {
      const error = await recentEmailsResponse.json();
      return NextResponse.json(error, { status: recentEmailsResponse.status });
    }

    const { emails } =
      (await recentEmailsResponse.json()) as RecentEmailsResponse;

    const analysis = await analyzeEmails(emails);

    const summariesMap = new Map(
      analysis.important_emails.map((item) => [item.id, item.summary])
    );

    const importantEmails = emails
      .filter((email: EmailData) => summariesMap.has(email.id))
      .map((email: EmailData) => ({
        ...email,
        summary: summariesMap.get(email.id),
      }));

    return NextResponse.json({
      emails: importantEmails,
    });
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
