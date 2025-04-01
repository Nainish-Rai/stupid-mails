"use client";

import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/app/components/auth/UserProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // This won't render on the client if the useEffect redirects
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1">
            <UserProfile />

            <div className="mt-4 space-y-2">
              <div className="font-medium text-lg">Settings</div>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/preferences">
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Email Classification Preferences
                  </span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              Welcome, {session.user.name || "User"}!
            </h2>
            <p className="text-gray-600 mb-4">
              You are now signed in to the application. This is a protected
              route that only authenticated users can access.
            </p>
            <div className="flex space-x-4 mt-6">
              <Button asChild>
                <Link href="/dashboard/preferences">
                  Configure Email Preferences
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.success("Success notification in green!", {
                    style: {
                      backgroundColor: "hsl(var(--success))",
                      color: "white",
                    },
                  })
                }
              >
                Test Notification
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
