"use client";

import HeroSection from "@/components/hero-section";

// import { useSession } from "@/lib/auth-client";
// import Link from "next/link";

export default function Home() {
  // const { data: session, isPending } = useSession();

  return (
    // <main className="flex min-h-screen flex-col items-center justify-center p-24">
    //   <div className="max-w-2xl mx-auto text-center">
    //     <h1 className="text-4xl font-bold mb-6">Welcome to Stupid Mails</h1>
    //     <p className="text-xl mb-8">The simplest way to manage your emails</p>

    //     <div className="mt-8">
    //       {isPending ? (
    //         <p>Loading...</p>
    //       ) : session ? (
    //         <div className="space-y-4">
    //           <p className="text-green-600">
    //             You are signed in as {session.user.email}
    //           </p>
    //           <Link
    //             href="/dashboard"
    //             className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    //           >
    //             Go to Dashboard
    //           </Link>
    //         </div>
    //       ) : (
    //         <div className="space-y-4">
    //           <p>You are not signed in</p>
    //           <Link
    //             href="/login"
    //             className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    //           >
    //             Sign In
    //           </Link>
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </main>
    <main>
      <HeroSection/>
    </main>
  );
}
