"use client";

import { useBatchClassify } from "@/lib/gmail-hooks";
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

export function TopEmailsDisplay() {
  const { prioritizedEmails, isLoading, error, labelsData, getCategoryConfig } =
    useEmailList(100, 20);

  console.log(
    prioritizedEmails,
    "prioritized emails",
    labelsData,
    "labels data"
  );

  // Batch classification mutation
  const { mutate: batchClassify, isPending: isClassifying } =
    useBatchClassify();

  const handleBatchClassify = () => {
    batchClassify({ batchSize: 20, onlyNew: true });
  };

  return (
    <Card className="w-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <InboxIcon className="h-5 w-5 text-indigo-500" />
              <span>Your Top 20 Emails</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              AI-prioritized based on what matters most to you
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchClassify}
            disabled={isClassifying}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isClassifying && "animate-spin")}
            />
            {isClassifying ? "Classifying..." : "Classify New"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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
            <p className="text-sm text-gray-600 mt-1">Please try again later</p>
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
                    {new Date(email.receivedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                              (l: {
                                id: string;
                                name: string;
                                color?: {
                                  backgroundColor?: string;
                                  textColor?: string;
                                };
                              }) => l.id === labelId
                            );
                            return label ? (
                              <Badge
                                key={labelId}
                                variant="secondary"
                                className="text-xs px-2 bg-opacity-50 group-hover:bg-opacity-75 transition-colors"
                                style={{
                                  backgroundColor:
                                    label.color?.backgroundColor || undefined,
                                  color: label.color?.textColor || undefined,
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
              Connect your Gmail account and classify your emails to see them
              here
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
