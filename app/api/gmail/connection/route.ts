import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createGmailClientForUser } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

// GET /api/gmail/connection - Check connection status
export async function GET(request: NextRequest) {
  try {
    // Get user from Better Auth session
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    // Retrieve the user's Gmail tokens from the database
    const userWithTokens = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        gmailAccessToken: true,
        gmailRefreshToken: true,
        tokenExpiresAt: true,
      },
    });

    // Check if user has Gmail tokens
    if (
      !userWithTokens?.gmailAccessToken ||
      !userWithTokens?.gmailRefreshToken ||
      !userWithTokens?.tokenExpiresAt
    ) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Create Gmail client and get profile data
    const gmailClient = await createGmailClientForUser(user.id);
    if (!gmailClient) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Attempt to get user profile to verify connection works
    const profile = await gmailClient.getUserProfile();

    // Get latest stats
    const latestSync = await prisma.processingStats.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
      orderBy: {
        endTime: "desc",
      },
    });

    return NextResponse.json({
      connected: true,
      email: profile.emailAddress,
      stats: {
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        lastSync: latestSync?.endTime,
      },
    });
  } catch (error) {
    console.error("Error checking Gmail connection:", error);

    const err = error as Error & { code?: string };
    // If token is invalid, clear it
    if (err.message?.includes("token") || err.code === "UNAUTHENTICATED") {
      try {
        const user = await currentUser(request);
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              gmailAccessToken: null,
              gmailRefreshToken: null,
              tokenExpiresAt: null,
            },
          });
        }
      } catch (dbError) {
        console.error("Error clearing invalid token:", dbError);
      }
    }

    return NextResponse.json({
      connected: false,
      error: {
        message: err.message || "Failed to connect to Gmail",
        code: err.code || "CONNECTION_ERROR",
      },
    });
  }
}
