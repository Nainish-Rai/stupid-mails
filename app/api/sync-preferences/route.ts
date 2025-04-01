import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sync-preferences - Sync customPrompt between preferences and classification settings
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

    // Get user preferences
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { customPrompt: true },
    });

    if (!userPrefs) {
      return NextResponse.json({
        message: "No preferences found to sync",
        synced: false,
      });
    }

    return NextResponse.json({
      message: "Preferences synced successfully",
      customPrompt: userPrefs.customPrompt,
      synced: true,
    });
  } catch (error) {
    console.error("Error syncing preferences:", error);
    return NextResponse.json(
      { error: "Failed to sync preferences" },
      { status: 500 }
    );
  }
}
