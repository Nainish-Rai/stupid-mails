/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "./prisma";
import {
  GmailProfile,
  GmailLabel,
  GmailMessage,
  EmailFetchOptions,
  ListEmailsResponse,
} from "./gmail-types";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerSecond: 20,
  maxRequestsPer100Seconds: 200,
  retryDelay: 1000,
  maxRetries: 3,
};

// Error types
export class GmailAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retriable: boolean = true
  ) {
    super(message);
    this.name = "GmailAPIError";
  }
}

// Gmail API client
export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private userId: string;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiryDate: Date
  ) {
    this.userId = userId;
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate.getTime(),
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  // Helper to handle rate limiting
  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    // Simple rate limiting - in production, consider using a more sophisticated approach
    const now = Date.now();
    if (now - this.lastRequestTime < 1000) {
      this.requestCount++;
      if (this.requestCount > RATE_LIMIT.maxRequestsPerSecond) {
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT.retryDelay)
        );
      }
    } else {
      this.lastRequestTime = now;
      this.requestCount = 1;
    }

    // Execute with retries
    let retries = 0;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        if (
          error.code === 429 || // Too many requests
          (error.code >= 500 && error.code < 600) // Server errors
        ) {
          if (retries < RATE_LIMIT.maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * RATE_LIMIT.retryDelay;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // Parse and throw appropriate error
        const message = error.message || "Unknown Gmail API error";
        const code = error.code || "UNKNOWN_ERROR";
        const retriable =
          error.code === 429 || (error.code >= 500 && error.code < 600);

        throw new GmailAPIError(message, code, retriable);
      }
    }
  }

  // Token refresh handler
  private async ensureValidToken(): Promise<void> {
    const credentials = this.oauth2Client.credentials;
    const expiryDate = credentials.expiry_date as number;
    // Check if token is expired or will expire in the next 5 minutes
    if (!expiryDate || Date.now() >= expiryDate - 5 * 60 * 1000) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);

        // Update token in database
        await prisma.user.update({
          where: { id: this.userId },
          data: {
            gmailAccessToken: credentials.access_token,
            gmailRefreshToken: credentials.refresh_token || undefined,
            tokenExpiresAt: new Date(credentials.expiry_date as number),
          },
        });
      } catch (error: any) {
        throw new GmailAPIError(
          "Failed to refresh token: " + error.message,
          "TOKEN_REFRESH_ERROR",
          true
        );
      }
    }
  }

  // Fetch emails with pagination
  async listEmails(
    options: EmailFetchOptions = {}
  ): Promise<ListEmailsResponse> {
    await this.ensureValidToken();

    return this.executeWithRateLimit(async () => {
      const { maxResults = 100, pageToken, labelIds, q } = options;

      const response = await this.gmail.users.messages.list({
        userId: "me",
        maxResults,
        pageToken,
        labelIds,
        q,
      });

      const messages = response.data.messages || [];
      const nextPageToken = response.data.nextPageToken;

      // Get full message details in parallel (with rate limiting)
      const emails = await Promise.all(
        messages.map((message: any) =>
          this.executeWithRateLimit(() =>
            this.gmail.users.messages.get({
              userId: "me",
              id: message.id,
              format: "metadata",
              metadataHeaders: ["From", "Subject", "Date"],
            })
          )
        )
      );

      return {
        emails: emails.map((email) => email.data) as GmailMessage[],
        nextPageToken,
      };
    });
  }

  // Get a single email by ID
  async getEmail(id: string): Promise<GmailMessage> {
    await this.ensureValidToken();

    return this.executeWithRateLimit(async () => {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id,
      });

      return response.data as GmailMessage;
    });
  }

  // List available labels
  async listLabels(): Promise<GmailLabel[]> {
    await this.ensureValidToken();

    return this.executeWithRateLimit(async () => {
      const response = await this.gmail.users.labels.list({
        userId: "me",
      });

      return (response.data.labels || []) as GmailLabel[];
    });
  }

  // The following methods would require write permissions and are disabled in read-only mode

  // Create a new label - Disabled in read-only mode
  async createLabel(): Promise<never> {
    throw new GmailAPIError(
      "Creating labels is not available in read-only mode",
      "READ_ONLY_MODE",
      false
    );
  }

  // Update a label - Disabled in read-only mode
  async updateLabel(): Promise<never> {
    throw new GmailAPIError(
      "Updating labels is not available in read-only mode",
      "READ_ONLY_MODE",
      false
    );
  }

  // Delete a label - Disabled in read-only mode
  async deleteLabel(): Promise<never> {
    throw new GmailAPIError(
      "Deleting labels is not available in read-only mode",
      "READ_ONLY_MODE",
      false
    );
  }

  // Modify message labels - Disabled in read-only mode
  async modifyMessageLabels(): Promise<never> {
    throw new GmailAPIError(
      "Modifying message labels is not available in read-only mode",
      "READ_ONLY_MODE",
      false
    );
  }

  // Get user profile
  async getUserProfile(): Promise<GmailProfile> {
    await this.ensureValidToken();

    return this.executeWithRateLimit(async () => {
      const response = await this.gmail.users.getProfile({
        userId: "me",
      });

      return response.data as GmailProfile;
    });
  }

  // Extracts email metadata from Gmail message
  parseEmailMetadata(message: GmailMessage): {
    subject: string;
    sender: string;
    receivedAt: Date;
    isRead: boolean;
  } {
    let subject = "";
    let sender = "";
    let receivedAt = new Date();
    const isRead = !message.labelIds.includes("UNREAD");

    if (message.payload && message.payload.headers) {
      // Extract headers
      for (const header of message.payload.headers) {
        if (header.name.toLowerCase() === "subject") {
          subject = header.value;
        } else if (header.name.toLowerCase() === "from") {
          sender = header.value;
        } else if (header.name.toLowerCase() === "date") {
          receivedAt = new Date(header.value);
        }
      }
    }

    // Fallback to internalDate if header date is missing
    if (!receivedAt && message.internalDate) {
      receivedAt = new Date(parseInt(message.internalDate));
    }

    return { subject, sender, receivedAt, isRead };
  }
}

// Factory function to create Gmail client from user ID
export async function createGmailClientForUser(
  userId: string
): Promise<GmailClient | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      gmailAccessToken: true,
      gmailRefreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (
    !user ||
    !user.gmailAccessToken ||
    !user.gmailRefreshToken ||
    !user.tokenExpiresAt
  ) {
    return null;
  }

  return new GmailClient(
    user.id,
    user.gmailAccessToken,
    user.gmailRefreshToken,
    user.tokenExpiresAt
  );
}
