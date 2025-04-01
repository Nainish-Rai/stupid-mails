/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useGmailEmails,
  useGmailLabels,
  useGmailSync,
  useBatchClassify,
  useClassifyEmail,
} from "@/lib/gmail-hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Filter, Inbox, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// type Label = {
//   id: string;
//   name: string;
//   gmailLabelId?: string;
// };

export function EmailList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [maxEmails, setMaxEmails] = useState(50);

  // Query for emails with current filters
  const {
    data: emailsData,
    isLoading: emailsLoading,
    error: emailsError,
    refetch: refetchEmails,
  } = useGmailEmails({
    maxResults: maxEmails,
    q: searchQuery || undefined,
    labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
  });

  // Query for labels
  const { data: labelsData, isLoading: labelsLoading } = useGmailLabels();

  // Mutation for syncing emails
  const { mutate: syncEmails, isPending: isSyncing } = useGmailSync();

  // Add classification mutations
  const { mutate: classifyEmail, isPending: isClassifying } =
    useClassifyEmail();
  const { mutate: batchClassify, isPending: isBatchClassifying } =
    useBatchClassify();

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchEmails();
  };

  // Toggle a label filter
  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  // Function to handle batch classification
  const handleBatchClassify = () => {
    batchClassify({ batchSize: 20, onlyNew: true });
  };

  // Function to classify a single email
  const handleClassifyEmail = (emailId: string) => {
    classifyEmail(emailId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Your Emails
        </CardTitle>
        <CardDescription>Browse and manage your Gmail messages</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Label filters */}
          {labelsLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ) : (
            labelsData?.labels && (
              <div className="flex flex-wrap gap-2">
                {labelsData.labels
                  .filter((label: any) => !label.name.includes("CATEGORY_"))
                  .slice(0, 10)
                  .map((label: any) => (
                    <Badge
                      key={label.id}
                      variant={
                        selectedLabels.includes(label.gmailLabelId || "")
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleLabel(label.gmailLabelId || "")}
                    >
                      {label.name}
                    </Badge>
                  ))}
                <Badge variant="secondary" className="cursor-pointer">
                  <Filter className="h-3 w-3 mr-1" />
                  More filters
                </Badge>
              </div>
            )
          )}
        </div>

        {/* Email list - modified to show categories */}
        {emailsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-4 border rounded-md"
              >
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : emailsError ? (
          <div className="p-4 text-destructive border border-destructive/20 rounded-md">
            Error loading emails: {emailsError.message}
          </div>
        ) : emailsData?.emails && emailsData.emails.length > 0 ? (
          <div className="space-y-2">
            {emailsData.emails.map((email: any) => (
              <div
                key={email.id}
                className={`p-4 border rounded-md hover:bg-secondary/50 cursor-pointer transition-colors ${!email.isRead ? "border-l-4 border-l-primary" : ""}`}
              >
                <div className="flex justify-between">
                  <div className="font-medium">{email.sender}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(email.receivedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-medium mt-1">{email.subject}</div>

                {/* Add classification badge if available */}
                {email.category && (
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      email.category === "ATTN"
                        ? "bg-red-100 text-red-800"
                        : email.category === "FK-U"
                          ? "bg-orange-100 text-orange-800"
                          : email.category === "MARKETING"
                            ? "bg-blue-100 text-blue-800"
                            : email.category === "TAKE-A-LOOK"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {email.category}
                  </Badge>
                )}

                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {email.snippet}
                </div>

                {/* Display labels */}
                {email.labelIds &&
                  email.labelIds.length > 0 &&
                  labelsData?.labels && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {email.labelIds
                        .filter(
                          (id: string) =>
                            !id.includes("CATEGORY_") &&
                            id !== "INBOX" &&
                            id !== "UNREAD"
                        )
                        .slice(0, 3)
                        .map((labelId: string) => {
                          const label = labelsData.labels.find(
                            (l: any) => l.gmailLabelId === labelId
                          );
                          return label ? (
                            <Badge
                              key={labelId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {label.name}
                            </Badge>
                          ) : null;
                        })}
                      {email.labelIds.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{email.labelIds.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                {/* Add classify button for uncategorized emails */}
                {!email.category && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClassifyEmail(email.id);
                    }}
                    disabled={isClassifying}
                  >
                    {isClassifying ? "Classifying..." : "Classify"}
                  </Button>
                )}
              </div>
            ))}

            {/* Load more button */}
            {emailsData.nextPageToken && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setMaxEmails((prev) => prev + 50)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-md">
            <div className="text-muted-foreground">No emails found</div>
            {searchQuery || selectedLabels.length > 0 ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLabels([]);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <div className="mt-2 text-sm">
                Try syncing your emails or connecting your Gmail account
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {emailsData?.emails
            ? `Showing ${emailsData.emails.length} of ${emailsData.total || "many"} emails`
            : " "}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBatchClassify}
            disabled={isBatchClassifying}
          >
            <Filter
              className={`h-4 w-4 mr-2 ${isBatchClassifying ? "animate-spin" : ""}`}
            />
            {isBatchClassifying ? "Classifying..." : "Classify Emails"}
          </Button>
          <Button
            variant="default"
            onClick={() => syncEmails()}
            disabled={isSyncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync Emails"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
