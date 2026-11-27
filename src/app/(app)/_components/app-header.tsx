"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { ButtonSpinner } from "@/components/ui/button-spinner";

export function AppHeader() {
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setErrorMessage(
          error.message || "Unable to sign out. Please try again.",
        );
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-lg font-bold">
            B
          </div>

          <span className="text-foreground text-xl font-bold tracking-tight">
            bookwise
          </span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="border-border bg-surface text-foreground hover:bg-surface-muted focus-visible:outline-accent cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? <ButtonSpinner label="Signing out..." /> : "Sign out"}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="border-danger/20 bg-danger/5 text-danger border-t px-4 py-2 text-center text-sm"
        >
          {errorMessage}
        </p>
      )}
    </header>
  );
}
