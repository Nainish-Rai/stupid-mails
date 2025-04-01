import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Google OAuth configuration
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

// Scopes needed for Gmail access - READONLY ONLY
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// GET /api/auth/google-gmail - Start Google OAuth flow for Gmail
export async function GET(request: NextRequest) {
  try {
    // Get current user from Better Auth
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Force to show consent screen to get refresh_token
      state: user.id, // Pass user ID in state to retrieve it in callback
    });

    // Redirect to Google OAuth consent page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}

// POST /api/auth/google-gmail/callback - Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get tokens from Google
    const { tokens } = await oauth2Client.getToken(code);

    // Verify state contains user ID
    if (!state) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Store tokens in database
    await prisma.user.update({
      where: { id: state },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.json(
      { error: "Failed to complete Google authentication" },
      { status: 500 }
    );
  }
}
