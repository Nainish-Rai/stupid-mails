import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateLabelOptions,
  EmailFetchOptions,
  GmailErrorDetails,
} from "./gmail-types";

// Define return types for custom batch classify
interface ClassificationResult {
  input: {
    sender: string;
    subject: string;
    date: string;
  };
  classification: string;
  reason: string;
  confidence?: number;
  success: boolean;
}

interface BatchClassifyResponse {
  processed: number;
  successful: number;
  failed: number;
  results: ClassificationResult[];
}

// Helper for making authenticated API calls
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    // Format error for consistent error handling
    const error: GmailErrorDetails = {
      code: data.error?.code || "API_ERROR",
      message: data.error?.message || "An error occurred with the API",
      retriable: response.status >= 500,
    };
    throw error;
  }

  return data;
}

// Clean email content function
function clean_email_content(text: string): string {
  // Remove style and script tags and their contents
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");

  // Remove image tags but keep alt text
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, "$1");
  text = text.replace(/<img[^>]*>/g, "");

  // Remove common marketing/footer patterns while preserving quote structure
  const patterns_to_remove = [
    /Copyright ©.*?(?=\n|$)/gi,
    /You are receiving this email because.*?(?=\n|$)/gi,
    /To connect with us.*?(?=\n|$)/gi,
    /Our mailing address.*?(?=\n|$)/gi,
    /Unsubscribe.*?(?=\n|$)/gi,
    /Add .* to your address book.*?(?=\n|$)/gi,
  ];

  for (const pattern of patterns_to_remove) {
    text = text.replace(pattern, "");
  }

  // Remove HTML attributes that don't affect content
  text = text.replace(/style="[^"]*"/g, "");
  text = text.replace(/class="[^"]*"/g, "");
  text = text.replace(/width="[^"]*"/g, "");
  text = text.replace(/height="[^"]*"/g, "");
  text = text.replace(/align="[^"]*"/g, "");

  // Remove URLs and base64 images while preserving link text
  text = text.replace(/<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/g, "$1");
  text = text.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/]+=*/g, "");

  // Remove remaining HTML tags but preserve their content
  text = text.replace(/<[^>]+>/g, " ");

  // Clean up whitespace while preserving email quote structure
  text = text.replace(/ +/g, " "); // Multiple spaces to single space
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n"); // Multiple blank lines to double line

  // Preserve common quote markers
  text = text.replace(/^\s*>+\s*/gm, "> "); // Standardize quote markers

  // Better quote handling - collapse multiple '>' into single '>'
  const lines = text.split("\n");
  const cleaned_lines = [];
  for (const line of lines) {
    // If line starts with multiple '>', reduce to single '>'
    if (line.trim().startsWith(">")) {
      // Remove extra spaces around '>' symbols
      let cleaned_line = line.replace(/\s*>\s*>\s*/g, "> ");
      // Ensure only one '>' at start with one space after
      cleaned_line = cleaned_line.replace(/^\s*>+\s*/g, "> ");
      cleaned_lines.push(cleaned_line);
    } else {
      cleaned_lines.push(line);
    }
  }

  text = cleaned_lines.join("\n");

  // Clean up any remaining multiple blank lines
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return text.trim();
}

// Hook for fetching emails
export function useGmailEmails(options: EmailFetchOptions = {}) {
  const queryParams = new URLSearchParams();

  if (options.maxResults) {
    queryParams.append("maxResults", options.maxResults.toString());
  }

  if (options.pageToken) {
    queryParams.append("pageToken", options.pageToken);
  }

  if (options.labelIds && options.labelIds.length > 0) {
    queryParams.append("labelIds", options.labelIds.join(","));
  }

  if (options.q) {
    queryParams.append("q", options.q);
  }

  return useQuery({
    queryKey: ["gmail", "emails", options],
    queryFn: () => fetchWithAuth(`/api/gmail/emails?${queryParams.toString()}`),
    // Don't refetch on window focus for emails to avoid rate limits
    refetchOnWindowFocus: false,
  });
}

// Hook for syncing emails
export function useGmailSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchWithAuth("/api/gmail/emails", { method: "POST" }),
    onSuccess: () => {
      // After sync completes, invalidate the emails queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
    },
  });
}

// Hook for fetching labels
export function useGmailLabels() {
  return useQuery({
    queryKey: ["gmail", "labels"],
    queryFn: () => fetchWithAuth("/api/gmail/labels"),
    // Labels don't change often, so we can cache them longer
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for creating a label
export function useCreateGmailLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: CreateLabelOptions) =>
      fetchWithAuth("/api/gmail/labels", {
        method: "POST",
        body: JSON.stringify(options),
      }),
    onSuccess: () => {
      // After creating a label, invalidate the labels query to refresh data
      queryClient.invalidateQueries({ queryKey: ["gmail", "labels"] });
    },
  });
}

// Hook for checking Gmail connection status
export function useGmailConnectionStatus() {
  return useQuery({
    queryKey: ["gmail", "connection"],
    queryFn: () => fetchWithAuth("/api/gmail/connection"),
    // Retry a few times in case of temporary errors
    retry: 2,
    // We can cache this for longer as it doesn't change often
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

// Hook for applying labels to an email
export function useApplyLabelsToEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      emailId,
      addLabelIds,
      removeLabelIds,
    }: {
      emailId: string;
      addLabelIds?: string[];
      removeLabelIds?: string[];
    }) =>
      fetchWithAuth(`/api/gmail/emails/${emailId}/labels`, {
        method: "POST",
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
      }),
    onSuccess: (data, variables) => {
      // Invalidate specific email data
      queryClient.invalidateQueries({
        queryKey: ["gmail", "emails", { id: variables.emailId }],
      });

      // Optionally update the email list cache if needed
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
    },
  });
}

// Hook for classifying a single email
export function useClassifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) =>
      fetchWithAuth("/api/gmail/emails/classify", {
        method: "POST",
        body: JSON.stringify({ emailId }),
      }),
    onSuccess: (data) => {
      // After classification, invalidate queries to refresh data
      console.log(data, "classification data");
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
    },
  });
}

// Hook for batch classifying emails
export function useBatchClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchSize = 10,
      onlyNew = true,
    }: {
      batchSize?: number;
      onlyNew?: boolean;
    }) =>
      fetchWithAuth(
        `/api/gmail/emails/classify/batch?batchSize=${batchSize}&onlyNew=${onlyNew}`,
        { method: "GET" }
      ),
    onSuccess: (data) => {
      // After batch classification, invalidate queries to refresh data
      console.log(data, "classification data");
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
    },
  });
}

// Interface for email input with content
interface EmailInput {
  id?: string;
  sender: string;
  subject: string;
  content: string;
  email_date: string;
}

// Hook for batch classifying emails with Gmail fetch and cleaning
export function useAutoFetchAndClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchSize = 20 }: { batchSize?: number } = {}) => {
      // Step 1: Fetch emails from Gmail
      const emailsResponse = await fetchWithAuth(
        `/api/gmail/emails?maxResults=${batchSize}`
      );

      if (!emailsResponse.emails || !Array.isArray(emailsResponse.emails)) {
        throw new Error("Failed to fetch emails from Gmail");
      }

      // Step 2: For each email, fetch its full content using the Gmail client
      const emailsWithContent: EmailInput[] = await Promise.all(
        emailsResponse.emails.map(async (email: any) => {
          // Fetch the full email content
          const fullEmailResponse = await fetchWithAuth(
            `/api/gmail/emails/${email.id}/content`
          );

          // Clean the content using our cleaning function
          const cleanedContent = clean_email_content(
            fullEmailResponse.content || email.snippet || ""
          );

          return {
            id: email.id,
            sender: email.sender,
            subject: email.subject,
            content: cleanedContent,
            email_date: email.receivedAt,
          };
        })
      );

      // Step 3: Send the batch for classification
      return fetchWithAuth("/api/gmail/emails/classify/batch", {
        method: "POST",
        body: JSON.stringify({ emails: emailsWithContent }),
      });
    },
    onSuccess: (data) => {
      // After classification, invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
      console.log(data, "auto-classified emails");
      return data;
    },
  });
}

// Hook for batch classifying emails with custom content
export function useCustomBatchClassify() {
  const queryClient = useQueryClient();

  return useMutation<BatchClassifyResponse, GmailErrorDetails, EmailInput[]>({
    mutationFn: (emails: EmailInput[]) =>
      fetchWithAuth("/api/gmail/emails/classify/batch", {
        method: "POST",
        body: JSON.stringify({ emails }),
      }),
    onSuccess: (data) => {
      // After batch classification, invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
      console.log(data, "classification data custom");
      return data;
    },
  });
}

// Hook for fetching user's classification settings
export function useClassificationSettings() {
  return useQuery({
    queryKey: ["classification", "settings"],
    queryFn: () => fetchWithAuth("/api/user/classification-settings"),
  });
}

// Hook for updating classification settings
export function useUpdateClassificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: { classificationPrompt: string }) =>
      fetchWithAuth("/api/user/classification-settings", {
        method: "POST",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classification", "settings"],
      });
    },
  });
}
