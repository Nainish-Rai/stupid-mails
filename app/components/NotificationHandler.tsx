"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function NotificationHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle URL parameters for notifications/errors
    const gmail = searchParams.get("gmail");
    const error = searchParams.get("error");

    if (gmail === "connected") {
      toast.success("Gmail connected successfully");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Failed to authenticate with Google",
        invalid_oauth_response: "Invalid OAuth response",
        gmail_not_connected: "Gmail account not connected",
      };

      toast.error(errorMessages[error] || "An error occurred");
    }
  }, [searchParams]);

  return null;
}
