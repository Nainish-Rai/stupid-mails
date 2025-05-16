import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

// Google OAuth configuration
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/auth/callback/google-gmail"
);

// GET /api/auth/callback/google - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from redirect
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle error from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_oauth_response`
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Use Better Auth to handle the user data
    // The state parameter contains the user ID from our session
    const userId = state;

    // Store tokens in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gmail=connected`
    );
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`
    );
  }
}
