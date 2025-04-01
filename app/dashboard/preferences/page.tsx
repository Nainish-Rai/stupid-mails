"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Sample default prompt template
const DEFAULT_PROMPT = `Please classify this email as either:

ATTN: emails that are clearly from a real person that wanted to reach out to me for a specific reason. you can also place high value notifcations here/ time sensitive.
FK-U: a special place in hell is for these people. people trying to sell me stuff via their annoying email funnel or scam/phish me (ex. "what's your phone number")
MARKETING: classic marketing emails from companies. safe to ignore type stuff. stuff like ny times/bloomberg type stuff fits in here.
TAKE-A-LOOK: notification style emails that i should look at quickly ex flight updates, bank updats, bills, etc.
HMMMM: if you really aren't sure where to put it. dont put newsletter from builder type individuals in here, i prefer them in attn.

Some context on my preferences:
- i dont care for news type emails/world updates.
- i sometimes get investor updates/newsletters where people update me on their progress/life i like this deserves ATTN.
- i get a lot of random builders/founders hit me up. i love that! but hate when its obviously no a personalized email to me. if unsure drop in HMMMM.

From: {sender}
Subject: {subject}
Content: {content}
Date Sent: {email_date}

Provide your classification and a brief explanation why in JSON format:
{{"classification": "ATTN/FK-U/MARKETING/TAKE-A-LOOK/HMMMM", "reason": "your explanation here"}}`;

interface UserPreferences {
  customPrompt: string;
  prioritySenders: string[];
  ignoredSenders: string[];
  contentKeywords: string[];
  processingFrequency: string;
  processingSchedule: Record<string, unknown> | null;
}

export default function ClassificationPreferencesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    customPrompt: DEFAULT_PROMPT,
    prioritySenders: [],
    ignoredSenders: [],
    contentKeywords: [],
    processingFrequency: "HOURLY",
    processingSchedule: null,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Fetch user preferences
  useEffect(() => {
    if (session) {
      fetchPreferences();
    }
  }, [session]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/preferences");

      if (response.ok) {
        const data = await response.json();
        // Use default prompt if customPrompt is empty
        setPreferences({
          ...data,
          customPrompt: data.customPrompt || DEFAULT_PROMPT,
        });
      } else {
        toast.error("Failed to load preferences");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("An error occurred while loading preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Preferences saved successfully");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("An error occurred while saving preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof UserPreferences,
    value: string | string[] | Record<string, unknown> | null
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Email Classification Preferences
          </h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        <p className="text-gray-600 mb-8">
          Define how you want your emails to be categorized. These preferences
          will be used by the AI to classify your emails.
        </p>

        {/* Classification Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Classification Instructions</CardTitle>
            <CardDescription>
              Customize the instructions given to the AI for classifying your
              emails. This replaces the need for a separate prompt.txt file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customPrompt" className="text-sm font-medium">
                  AI Classification Prompt
                </Label>
                <textarea
                  id="customPrompt"
                  rows={15}
                  className="w-full mt-1 p-3 border rounded-md resize-y font-mono text-sm"
                  value={preferences.customPrompt}
                  onChange={(e) => handleChange("customPrompt", e.target.value)}
                  placeholder="Enter your classification instructions..."
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-2">
                  You can use {"{sender}"}, {"{subject}"}, {"{content}"}, and{" "}
                  {"{email_date}"} as placeholders that will be replaced with
                  actual email data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sender Preferences */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sender Preferences</CardTitle>
            <CardDescription>
              Define which senders are important to you and which ones you would
              prefer to ignore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="prioritySenders"
                  className="text-sm font-medium"
                >
                  Priority Senders
                </Label>
                <TagInput
                  tags={preferences.prioritySenders}
                  onChange={(tags) => handleChange("prioritySenders", tags)}
                  placeholder="Add email address or domain..."
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emails from these senders will be prioritized. Enter email
                  addresses or domains.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="ignoredSenders" className="text-sm font-medium">
                  Ignored Senders
                </Label>
                <TagInput
                  tags={preferences.ignoredSenders}
                  onChange={(tags) => handleChange("ignoredSenders", tags)}
                  placeholder="Add email address or domain..."
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emails from these senders will be deprioritized. Enter email
                  addresses or domains.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content-Based Rules */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Content-Based Rules</CardTitle>
            <CardDescription>
              Define keywords or topics that help identify important emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="contentKeywords" className="text-sm font-medium">
                Important Keywords & Topics
              </Label>
              <TagInput
                tags={preferences.contentKeywords}
                onChange={(tags) => handleChange("contentKeywords", tags)}
                placeholder="Add keyword or topic..."
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Emails containing these keywords or topics will be considered
                more important.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Processing Frequency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Processing Settings</CardTitle>
            <CardDescription>
              Control how often your emails are processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="processingFrequency"
                  className="text-sm font-medium"
                >
                  Processing Frequency
                </Label>
                <select
                  id="processingFrequency"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={preferences.processingFrequency}
                  onChange={(e) =>
                    handleChange("processingFrequency", e.target.value)
                  }
                  disabled={isSaving}
                >
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                  <option value="CUSTOM">Custom</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How often should we check for and process new emails?
                </p>
              </div>
              {preferences.processingFrequency === "CUSTOM" && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm">
                    Custom schedule configuration will be available soon.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
