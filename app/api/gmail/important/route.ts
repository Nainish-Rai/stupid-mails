import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Groq } from "groq-sdk";

const groq = new Groq();

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an email analyzer that:
1. Selects the top 20 most important emails based on urgency, sender credibility, content relevance, and time sensitivity
2. Creates a brief, actionable summary for each selected email, It should use casual and funny language.
Return only a JSON object with array 'important_emails' containing objects with 'id' and 'summary' fields.`,
        },
        {
          role: "user",
          content: JSON.stringify(emailsData),
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.6,
      // max_completion_tokens: 4096,
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

    const result = JSON.parse(content) as GroqResponse;
    return result;
  } catch (error) {
    console.error("Error in Groq AI call:", error);
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

    // Get important emails with summaries
    const analysis = await analyzeEmails(emails);

    // Create a map of summaries for quick lookup
    const summariesMap = new Map(
      analysis.important_emails.map((item) => [item.id, item.summary])
    );

    // Filter and enhance emails with summaries
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
