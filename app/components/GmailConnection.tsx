"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Clock, Star } from "lucide-react";

interface GmailMessage {
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

interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

type EmailType = "today" | "recent" | "important";

export function GmailConnection() {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailType, setEmailType] = useState<EmailType>("today");
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/gmail/emails", {
        credentials: "include",
      });
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const connectGmail = async () => {
    try {
      window.location.href = "/api/auth/google-gmail";
    } catch {
      setError("Failed to connect to Gmail");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const fetchEmails = async (type: EmailType) => {
    try {
      setLoading(true);
      setError(null);
      setEmailType(type);

      const response = await fetch(`/api/gmail/${type}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error?.message || "Failed to fetch emails");
      }
      console.log(data);
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (type: EmailType) => {
    switch (type) {
      case "today":
        return "Today's Emails";
      case "recent":
        return "Recent Emails";
      case "important":
        return "Important Emails";
      default:
        return "Emails";
    }
  };

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">
            Connect your Gmail account
          </h2>
          <Button onClick={connectGmail}>
            <Mail className="h-4 w-4 mr-2" />
            Connect Gmail
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{getTitle(emailType)}</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchEmails("today")}
                disabled={loading}
                variant={emailType === "today" ? "default" : "outline"}
                size="sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button
                onClick={() => fetchEmails("recent")}
                disabled={loading}
                variant={emailType === "recent" ? "default" : "outline"}
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </Button>
              <Button
                onClick={() => fetchEmails("important")}
                disabled={loading}
                variant={emailType === "important" ? "default" : "outline"}
                size="sm"
              >
                <Star className="h-4 w-4 mr-2" />
                Important
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {emails.length > 0 && (
            <div className="grid max-w-7xl mx-auto gap-4">
              {emails.map((email) => (
                <Card key={email.id} className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">{email.subject}</div>
                    {email.summary && emailType === "important" && (
                      <div className="text-sm bg-blue-50 text-blue-700 p-2 rounded">
                        {email.summary}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">{email.snippet}</div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>From: {email.sender}</span>
                      <span>{new Date(email.receivedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && emails.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No emails found
            </div>
          )}
        </>
      )}
    </div>
  );
}
