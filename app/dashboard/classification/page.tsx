"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useClassificationSettings,
  useUpdateClassificationSettings,
} from "@/lib/gmail-hooks";

// Default prompt text that will be used if user hasn't set a custom one
const DEFAULT_PROMPT = `You are an AI assistant that helps classify emails into categories.
Analyze the email content, subject, and sender to determine the most appropriate category.

Categories:
- ATTN: Urgent emails requiring immediate attention
- FK-U: Spam, scams, or unwanted communications
- MARKETING: Promotional emails and newsletters
- TAKE-A-LOOK: Non-urgent but potentially interesting or useful emails
- HMMMM: Emails that are ambiguous or need more context to categorize

Provide your classification and a brief explanation why in JSON format:
{"classification": "ATTN/FK-U/MARKETING/TAKE-A-LOOK/HMMMM", "reason": "your explanation here", "confidence": 0.0-1.0}`;

// Form validation schema
const formSchema = z.object({
  classificationPrompt: z.string().min(10, {
    message: "Classification prompt must be at least 10 characters.",
  }),
});

export default function ClassificationSettingsPage() {
  // Fetch current settings
  const { data: settings } = useClassificationSettings();

  // Update settings mutation
  const { mutate: updateSettings, isPending } =
    useUpdateClassificationSettings();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classificationPrompt: DEFAULT_PROMPT,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings?.classificationPrompt) {
      form.setValue("classificationPrompt", settings.classificationPrompt);
    }
  }, [settings, form]);

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateSettings(values, {
      onSuccess: () => {
        toast.success("Settings updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update settings. Try again.");
      },
    });
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Email Classification Settings</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Classification Instructions</CardTitle>
          <CardDescription>
            Customize how the AI classifies your emails by editing the prompt
            below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="classificationPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Classification Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your classification instructions..."
                        className="min-h-[300px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This prompt tells the AI how to categorize your emails.
                      You can customize the categories and criteria for
                      classification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.reset({ classificationPrompt: DEFAULT_PROMPT })
                  }
                >
                  Reset to Default
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification Categories</CardTitle>
          <CardDescription>
            These are the categories used by the AI to classify your emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="border p-4 rounded-md bg-red-50">
              <h3 className="font-bold">ATTN</h3>
              <p>Urgent emails requiring immediate attention or action</p>
            </div>

            <div className="border p-4 rounded-md bg-orange-50">
              <h3 className="font-bold">FK-U</h3>
              <p>Spam, scams, or unwanted communications</p>
            </div>

            <div className="border p-4 rounded-md bg-blue-50">
              <h3 className="font-bold">MARKETING</h3>
              <p>
                Promotional emails, newsletters, and marketing communications
              </p>
            </div>

            <div className="border p-4 rounded-md bg-green-50">
              <h3 className="font-bold">TAKE-A-LOOK</h3>
              <p>Non-urgent but potentially interesting or useful emails</p>
            </div>

            <div className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-bold">HMMMM</h3>
              <p>
                Emails that are ambiguous or need more context to categorize
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
