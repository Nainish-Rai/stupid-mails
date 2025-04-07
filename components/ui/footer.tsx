"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-4 md:flex md:items-center md:justify-between lg:px-8">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Stupid Mails. All rights reserved.
          </p>
        </div>
        <div className="mt-4 flex justify-center space-x-6 md:mt-0">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
