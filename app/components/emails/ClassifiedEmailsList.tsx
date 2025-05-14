"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Tag, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClassifiedEmail {
  id: string;
  subject: string;
  snippet: string;
  sender: string;
  receivedAt: string;
  isRead: boolean;
  classificationType: string | null;
  classificationReason: string | null;
}

export function ClassifiedEmailsList() {
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClassifiedEmails() {
      try {
        setLoading(true);
        const response = await fetch("/api/gmail/classify", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch classified emails");
        }

        const data = await response.json();
        setEmails(data.emails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching classified emails:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClassifiedEmails();
  }, []);

  function getClassificationColor(type: string | null): string {
    if (!type) return "bg-gray-100 text-gray-800";

    switch (type.toLowerCase()) {
      case "important":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-orange-100 text-orange-800";
      case "work":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-green-100 text-green-800";
      case "newsletter":
        return "bg-purple-100 text-purple-800";
      case "promotion":
        return "bg-yellow-100 text-yellow-800";
      case "social":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No classified emails yet</h3>
        <p className="text-gray-500 mb-4">
          Connect your Gmail account and emails will be automatically
          classified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Tag className="h-5 w-5" />
        Classified Emails
      </h2>

      <div className="grid gap-3">
        {emails.map((email) => (
          <Card
            key={email.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="space-y-2">
              <div className="font-medium">{email.subject}</div>
              <div className="text-sm text-gray-600">{email.snippet}</div>

              {email.classificationType && (
                <Badge
                  className={`${getClassificationColor(email.classificationType)} mr-2`}
                >
                  {email.classificationType}
                </Badge>
              )}

              {email.classificationReason && (
                <div className="text-xs text-gray-500 italic mt-1">
                  {email.classificationReason}
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-500 pt-1">
                <span>From: {email.sender}</span>
                <span>{new Date(email.receivedAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
