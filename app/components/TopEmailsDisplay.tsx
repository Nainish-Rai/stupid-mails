/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useAutoFetchAndClassify,
  useCustomBatchClassify,
} from "@/lib/gmail-hooks";
import { useEmailList } from "@/lib/hooks/useEmailList";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { InboxIcon, StarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ClassificationResultCard } from "./ClassificationResultCard";

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

export function TopEmailsDisplay() {
  const { prioritizedEmails, isLoading, error, labelsData, getCategoryConfig } =
    useEmailList(100, 20);

  // State for batch classification results
  const [classificationResults, setClassificationResults] = useState<
    ClassificationResult[]
  >([]);
  const [showClassifications, setShowClassifications] = useState(false);

  // Real Gmail emails classification mutation
  const { mutate: autoFetchAndClassify, isPending: isAutoClassifying } =
    useAutoFetchAndClassify();
  const { mutate: customBatchClassify, isPending: isCustomClassifying } =
    useCustomBatchClassify();

  // Handle real Gmail email classification
  const handleRealEmailClassify = () => {
    autoFetchAndClassify(
      { batchSize: 20 },
      {
        onSuccess: (response: any) => {
          if (response && response.results) {
            setClassificationResults(
              response.results.filter((r: any) => r.success)
            );
            setShowClassifications(true);
          }
        },
      }
    );
  };

  return (
    <Card className="w-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <InboxIcon className="h-5 w-5 text-indigo-500" />
              <span>
                {showClassifications
                  ? "Classification Results"
                  : "Your Top 20 Emails"}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              {showClassifications
                ? "Email classification results based on your preferences"
                : "AI-prioritized based on what matters most to you"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRealEmailClassify}
              disabled={isAutoClassifying || isCustomClassifying}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-2",
                  (isAutoClassifying || isCustomClassifying) && "animate-spin"
                )}
              />
              {isAutoClassifying
                ? "Processing Emails..."
                : "Classify 20 Gmail Emails"}
            </Button>
            {showClassifications && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowClassifications(false)}
              >
                Show Emails
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Classification Results View */}
        {showClassifications ? (
          <div className="p-4">
            {classificationResults.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {classificationResults.map((result, index) => (
                  <ClassificationResultCard key={index} result={result} />
                ))}
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500">
                  No classification results available.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Click &quot;Classify 20 Gmail Emails&quot; to fetch and
                  classify your emails.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Original Email List View
          <>
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-3 rounded-md bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
                <div className="text-center text-sm text-gray-400 py-2">
                  Loading your important emails...
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-500">Couldn&apos;t load your emails</p>
                <p className="text-sm text-gray-600 mt-1">
                  Please try again later
                </p>
              </div>
            ) : prioritizedEmails.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {prioritizedEmails.map((email) => (
                  <div
                    key={email.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group",
                      !email.isRead && "border-l-4 border-l-indigo-400 pl-3"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {email.sender}
                        {email.isImportant && (
                          <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(email.receivedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>

                    <div className="font-medium text-sm text-gray-800 mb-1">
                      {email.subject}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {/* AI Classification badge */}
                      {email.category && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-normal px-2 border group-hover:scale-105 transition-transform",
                            email.categoryStyle
                          )}
                          title={getCategoryConfig(email.category)?.description}
                        >
                          {email.category}
                          {email.categoryConfidence &&
                            email.categoryConfidence > 0.8 && (
                              <span className="ml-1 opacity-50">★</span>
                            )}
                        </Badge>
                      )}

                      {/* Gmail labels */}
                      {email.labelIds &&
                        email.labelIds.length > 0 &&
                        labelsData?.labels && (
                          <>
                            {email.labelIds
                              .filter(
                                (id) =>
                                  !id.includes("CATEGORY_") &&
                                  id !== "INBOX" &&
                                  id !== "UNREAD"
                              )
                              .slice(0, 3)
                              .map((labelId) => {
                                const label = labelsData.labels.find(
                                  (l: any) => l.id === labelId
                                );
                                return label ? (
                                  <Badge
                                    key={labelId}
                                    variant="secondary"
                                    className="text-xs px-2 bg-opacity-50 group-hover:bg-opacity-75 transition-colors"
                                    style={{
                                      backgroundColor:
                                        label.color?.backgroundColor ||
                                        undefined,
                                      color:
                                        label.color?.textColor || undefined,
                                    }}
                                  >
                                    {label.name}
                                  </Badge>
                                ) : null;
                              })}
                            {email.labelIds.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{email.labelIds.length - 3}
                              </Badge>
                            )}
                          </>
                        )}
                    </div>

                    <div className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                      {email.snippet}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400">No prioritized emails found</div>
                <div className="mt-2 text-sm text-gray-500">
                  Connect your Gmail account and classify your emails to see
                  them here
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
