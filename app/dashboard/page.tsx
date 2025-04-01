"use client";

import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/app/components/auth/UserProfile";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GmailConnection } from "../components/GmailConnection";
import { EmailList } from "../components/EmailList";
import { TopEmailsDisplay } from "../components/TopEmailsDisplay";
import { NotificationHandler } from "../components/NotificationHandler";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Handle URL params in a suspense boundary
  const NotificationsWrapper = () => (
    <Suspense fallback={null}>
      <NotificationHandler />
    </Suspense>
  );

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
    <div className="min-h-screen bg-gray-50">
      <NotificationsWrapper />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          <span className="text-indigo-600">Stupid</span> Mails Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <UserProfile />

              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h2 className="font-medium text-lg mb-4">Settings</h2>
                <div className="space-y-2">
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
                        Email Preferences
                      </span>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard/classification">
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
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                          <path d="M17 0v7" />
                        </svg>
                        Classification Settings
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>

              <GmailConnection />
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome card */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">
                Welcome, {session.user?.name || "User"}!
              </h2>
              <p className="text-gray-600 mb-4">
                Now let&apos;s help you manage your emails without anxiety.
              </p>
            </div>

            {/* Top 20 emails section */}
            <TopEmailsDisplay />

            {/* All emails section */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">All Your Emails</h2>
              <p className="text-gray-600 mb-4">
                View and manage your complete email collection
              </p>
              <EmailList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
