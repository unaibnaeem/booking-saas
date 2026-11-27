"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { PasswordInput } from "@/components/ui/password-input";
import { ButtonSpinner } from "@/components/ui/button-spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe: true,
      });

      if (signInError) {
        setErrorMessage(
          signInError.message || "The email address or password is incorrect.",
        );
        return;
      }

      const { data: organizations, error: organizationsError } =
        await authClient.organization.list();

      if (organizationsError || !organizations) {
        setErrorMessage(
          "Signed in, but unable to load your organizations. Please refresh and try again.",
        );
        return;
      }

      if (organizations.length === 0) {
        router.replace("/onboarding/organization");
        return;
      }

      if (organizations.length === 1) {
        const { error: activeOrganizationError } =
          await authClient.organization.setActive({
            organizationId: organizations[0].id,
          });

        if (activeOrganizationError) {
          setErrorMessage(
            activeOrganizationError.message ||
              "Unable to activate your organization. Please try again.",
          );
          return;
        }

        router.replace("/dashboard");
        return;
      }

      router.replace("/select-organization");
    } catch {
      setErrorMessage("Unable to complete sign in. Please try again.");
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
              Welcome back
            </h1>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Sign in to your Bookwise account to manage your organization and
              bookings.
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
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3.5 text-sm transition outline-none focus:ring-2"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-foreground block text-sm font-medium"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-accent hover:text-primary text-sm font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
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
                <ButtonSpinner label="Signing in..." />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="border-border mt-7 border-t pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              New to Bookwise?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-accent font-semibold transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </p>
      </div>
    </main>
  );
}
