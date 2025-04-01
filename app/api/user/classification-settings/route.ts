import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/classification-settings
export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Get the user's classification settings from UserPreference
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { customPrompt: true },
    });

    return NextResponse.json({
      // We keep the response format as classificationPrompt for backward compatibility
      // but get the data from customPrompt
      classificationPrompt: userPrefs?.customPrompt || null,
    });
  } catch (error) {
    console.error("Error fetching classification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch classification settings" },
      { status: 500 }
    );
  }
}

// POST /api/user/classification-settings
export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Parse the request body
    const { classificationPrompt } = await request.json();

    if (typeof classificationPrompt !== "string") {
      return NextResponse.json(
        {
          error: { message: "Invalid prompt format", code: "INVALID_REQUEST" },
        },
        { status: 400 }
      );
    }

    // Update the user's classification settings in UserPreference
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        customPrompt: classificationPrompt,
      },
      update: {
        customPrompt: classificationPrompt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating classification settings:", error);
    return NextResponse.json(
      { error: "Failed to update classification settings" },
      { status: 500 }
    );
  }
}
