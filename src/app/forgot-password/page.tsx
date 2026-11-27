"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { ButtonSpinner } from "@/components/ui/button-spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(
          error.message || "Unable to process your request. Please try again.",
        );
        return;
      }

      setSuccessMessage(
        "If an account exists with this email address, a password reset link has been generated. Since email delivery is simulated in development, check your development server terminal for the link.",
      );
    } catch {
      setErrorMessage(
        "Unable to connect to the authentication service. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-3 inline-flex items-center justify-center gap-2.5"
          >
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-lg font-bold">
              B
            </div>

            <span className="text-foreground text-2xl font-bold tracking-tight">
              bookwise
            </span>
          </Link>

          <p className="text-muted-foreground text-sm">
            Simple scheduling. Better business.
          </p>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-7 shadow-sm sm:p-9">
          <div className="mb-7">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              Forgot your password?
            </h1>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Enter the email address associated with your Bookwise account.
              We&apos;ll help you reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3.5 text-sm transition outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-3.5 py-3 text-sm"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="border-success/20 bg-success/5 text-success rounded-lg border px-3.5 py-3 text-sm leading-6"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary flex h-11 w-full cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <ButtonSpinner label="Sending request..." />
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          <div className="border-border mt-7 border-t pt-6 text-center">
            <Link
              href="/login"
              className="text-primary hover:text-accent text-sm font-semibold transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </p>
      </div>
    </main>
  );
}
