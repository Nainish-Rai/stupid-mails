import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateLabelOptions,
  EmailFetchOptions,
  GmailErrorDetails,
} from "./gmail-types";

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
