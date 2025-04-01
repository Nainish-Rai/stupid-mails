import { useGmailEmails, useGmailLabels } from "@/lib/gmail-hooks";
import { useEffect, useState } from "react";

export interface EmailWithCategory {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  isRead: boolean;
  isImportant: boolean;
  category?: string;
  labelIds?: string[];
  categoryConfidence?: number;
  categoryStyle?: string;
}

export interface CategoryConfig {
  name: string;
  priority: number;
  baseStyle: string;
  borderStyle: string;
  textStyle: string;
  description: string;
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  ATTN: {
    name: "ATTN",
    priority: 1,
    baseStyle: "bg-red-50",
    borderStyle: "border-red-200",
    textStyle: "text-red-800",
    description: "Urgent and important emails requiring immediate attention",
  },
  "TAKE-A-LOOK": {
    name: "TAKE-A-LOOK",
    priority: 2,
    baseStyle: "bg-emerald-50",
    borderStyle: "border-emerald-200",
    textStyle: "text-emerald-800",
    description: "Important updates and notifications to check soon",
  },
  HMMMM: {
    name: "HMMMM",
    priority: 3,
    baseStyle: "bg-purple-50",
    borderStyle: "border-purple-200",
    textStyle: "text-purple-800",
    description: "Emails that need further investigation",
  },
  "FK-U": {
    name: "FK-U",
    priority: 4,
    baseStyle: "bg-orange-50",
    borderStyle: "border-orange-200",
    textStyle: "text-orange-800",
    description: "Unwanted or spam emails",
  },
  MARKETING: {
    name: "MARKETING",
    priority: 5,
    baseStyle: "bg-blue-50",
    borderStyle: "border-blue-200",
    textStyle: "text-blue-800",
    description: "Marketing and promotional emails",
  },
};

export function useEmailList(
  maxResults: number = 100,
  maxDisplay: number = 20
) {
  const [prioritizedEmails, setPrioritizedEmails] = useState<
    EmailWithCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    data: emailsData,
    isLoading: emailsLoading,
    error: emailsError,
  } = useGmailEmails({
    maxResults,
  });

  const { data: labelsData, isLoading: labelsLoading } = useGmailLabels();

  useEffect(() => {
    setIsLoading(emailsLoading || labelsLoading);
  }, [emailsLoading, labelsLoading]);

  useEffect(() => {
    if (emailsData?.emails && emailsData.emails.length > 0) {
      const sortedEmails = [...emailsData.emails]
        // First sort by category priority and confidence
        .sort((a, b) => {
          const aCategory = CATEGORIES[a.category || ""] || { priority: 999 };
          const bCategory = CATEGORIES[b.category || ""] || { priority: 999 };

          // If priorities are equal, use confidence as a tiebreaker
          if (aCategory.priority === bCategory.priority) {
            const aConfidence = a.categoryConfidence || 0;
            const bConfidence = b.categoryConfidence || 0;
            return bConfidence - aConfidence;
          }

          return aCategory.priority - bCategory.priority;
        })
        // Then sort by date within same category and confidence
        .sort((a, b) => {
          const sameCategory = a.category === b.category;
          const similarConfidence =
            Math.abs(
              (a.categoryConfidence || 0) - (b.categoryConfidence || 0)
            ) < 0.1;

          if (sameCategory && similarConfidence) {
            return (
              new Date(b.receivedAt).getTime() -
              new Date(a.receivedAt).getTime()
            );
          }
          return 0;
        })
        // Map to include category styles
        .map((email) => ({
          ...email,
          categoryStyle: email.category
            ? `${CATEGORIES[email.category]?.baseStyle} ${CATEGORIES[email.category]?.borderStyle} ${CATEGORIES[email.category]?.textStyle}`
            : "bg-gray-50 border-gray-200 text-gray-800",
        }));

      setPrioritizedEmails(sortedEmails.slice(0, maxDisplay));
    }
  }, [emailsData, maxDisplay]);

  const getCategoryConfig = (category: string): CategoryConfig | undefined => {
    return CATEGORIES[category];
  };

  return {
    prioritizedEmails,
    isLoading,
    error: emailsError,
    labelsData,
    getCategoryConfig,
    CATEGORIES,
  };
}
