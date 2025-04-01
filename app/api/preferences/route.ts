import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Retrieve user preferences
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get user preferences from the database
    const preferences = await prisma.userPreference.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // If no preferences exist yet, return default values
    if (!preferences) {
      return NextResponse.json({
        customPrompt: "",
        prioritySenders: [],
        ignoredSenders: [],
        contentKeywords: [],
        processingFrequency: "HOURLY",
        processingSchedule: null,
      });
    }

    // Parse JSON string fields into arrays
    return NextResponse.json({
      ...preferences,
      prioritySenders: preferences.prioritySenders
        ? JSON.parse(preferences.prioritySenders)
        : [],
      ignoredSenders: preferences.ignoredSenders
        ? JSON.parse(preferences.ignoredSenders)
        : [],
      contentKeywords: preferences.contentKeywords
        ? JSON.parse(preferences.contentKeywords)
        : [],
      processingSchedule: preferences.processingSchedule
        ? JSON.parse(preferences.processingSchedule)
        : null,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch user preferences" },
      { status: 500 }
    );
  }
}

// POST: Update or create user preferences
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();

    // Validate input data
    const {
      customPrompt,
      prioritySenders,
      ignoredSenders,
      contentKeywords,
      processingFrequency,
      processingSchedule,
    } = data;

    // Stringify array fields for storage
    const preferences = await prisma.userPreference.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        customPrompt,
        prioritySenders: prioritySenders
          ? JSON.stringify(prioritySenders)
          : null,
        ignoredSenders: ignoredSenders ? JSON.stringify(ignoredSenders) : null,
        contentKeywords: contentKeywords
          ? JSON.stringify(contentKeywords)
          : null,
        processingFrequency: processingFrequency || "HOURLY",
        processingSchedule: processingSchedule
          ? JSON.stringify(processingSchedule)
          : null,
      },
      create: {
        userId: session.user.id,
        customPrompt,
        prioritySenders: prioritySenders
          ? JSON.stringify(prioritySenders)
          : null,
        ignoredSenders: ignoredSenders ? JSON.stringify(ignoredSenders) : null,
        contentKeywords: contentKeywords
          ? JSON.stringify(contentKeywords)
          : null,
        processingFrequency: processingFrequency || "HOURLY",
        processingSchedule: processingSchedule
          ? JSON.stringify(processingSchedule)
          : null,
      },
    });

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
}
