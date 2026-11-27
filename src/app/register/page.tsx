"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { PasswordInput } from "@/components/ui/password-input";
import { ButtonSpinner } from "@/components/ui/button-spinner";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(120),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(12, "Password must contain at least 12 characters.")
      .max(128, "Password cannot exceed 128 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: validation.data.name,
        email: validation.data.email.toLowerCase(),
        password: validation.data.password,
      });

      if (error) {
        setErrorMessage(
          error.message || "Unable to create your account. Please try again.",
        );
        return;
      }

      router.replace("/onboarding/organization");
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
              Create your account
            </h1>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Get started with Bookwise by creating your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3.5 text-sm transition outline-none focus:ring-2"
              />
            </div>

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
              <label
                htmlFor="password"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={12}
                maxLength={128}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
                <ButtonSpinner label="Creating account..." />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="border-border mt-7 border-t pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-accent font-semibold transition-colors"
              >
                Sign in
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
