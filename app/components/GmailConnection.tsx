import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useGmailConnectionStatus } from "@/lib/gmail-hooks";
import { useSession } from "@/lib/auth-client";
import { ArrowRight, Mail, RefreshCw } from "lucide-react";

export function GmailConnection() {
  const { data: session } = useSession();
  const { data, isLoading, error, refetch } = useGmailConnectionStatus();

  const connected = data?.connected;

  const handleConnect = () => {
    // Only attempt to connect if user is authenticated
    if (session?.user) {
      // Redirect to Google OAuth flow
      window.location.href = "/api/auth/google-gmail";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to enable email classification and
          management
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-destructive">
            Error checking connection status: {error.message}
          </div>
        ) : connected ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-3 w-3 rounded-full bg-green-600"></div>
              <span>Connected to Gmail</span>
            </div>
            {data.email && (
              <div className="text-sm text-muted-foreground">
                Logged in as: {data.email}
              </div>
            )}
            {data.stats && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-muted-foreground">Total Emails</div>
                  <div className="text-xl font-semibold">
                    {data.stats.messagesTotal.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-muted-foreground">Last Synced</div>
                  <div className="text-xl font-semibold">
                    {data.stats.lastSync
                      ? new Date(data.stats.lastSync).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p>
              Connect your Gmail account to get started with automatic email
              classification and prioritization.
            </p>
            <div className="rounded-md bg-secondary p-4">
              <h4 className="font-medium">What we need access to:</h4>
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li>Read your emails (to analyze and categorize them)</li>
                <li>Modify labels (to organize your inbox)</li>
                <li>We never store full email content for privacy</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {!isLoading && !error && (
          <>
            {connected ? (
              <Button
                variant="default"
                onClick={() => refetch()}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={!session?.user}
                className="gap-1"
              >
                Connect Gmail
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
