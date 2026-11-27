"use client";

import { Suspense, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { PasswordInput } from "@/components/ui/password-input";
import { ButtonSpinner } from "@/components/ui/button-spinner";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-background flex min-h-screen items-center justify-center px-4">
          <p className="text-muted-foreground text-sm">Loading reset link...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const resetError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage(
        "Your reset link is invalid or has expired. Please request a new one.",
      );
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setErrorMessage("Your password must be between 12 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setErrorMessage(
          error.message ||
            "Unable to reset your password. Please request a new link.",
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Your password has been reset successfully. You can now sign in with your new password.",
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
              Reset your password
            </h1>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Choose a new password for your Bookwise account.
            </p>
          </div>

          {!token || resetError ? (
            <div className="space-y-5">
              <div
                role="alert"
                className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-3.5 py-3 text-sm leading-6"
              >
                This password reset link is invalid or has expired. Please
                request a new one.
              </div>

              <Link
                href="/forgot-password"
                className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Request a new reset link
              </Link>
            </div>
          ) : successMessage ? (
            <div className="space-y-5">
              <div
                role="status"
                className="border-success/20 bg-success/5 text-success rounded-lg border px-3.5 py-3 text-sm leading-6"
              >
                {successMessage}
              </div>

              <Link
                href="/login"
                className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Continue to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  New password
                </label>

                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={12}
                  maxLength={128}
                  required
                  disabled={isSubmitting}
                />

                <p className="text-muted-foreground mt-1.5 text-xs">
                  Use between 12 and 128 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Confirm new password
                </label>

                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Enter your new password again"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={isSubmitting}
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary flex h-11 w-full cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <ButtonSpinner label="Resetting password..." />
                ) : (
                  "Reset password"
                )}
              </button>
            </form>
          )}

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
