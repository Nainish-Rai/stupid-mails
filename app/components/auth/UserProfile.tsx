"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function UserProfile() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  if (!session) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user?.name || "User"}
              className="h-full w-full object-cover"
              width={48}
              height={48}
            />
          ) : (
            <User className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {session.user?.name || "User"}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {session.user?.email}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </div>
  );
}
