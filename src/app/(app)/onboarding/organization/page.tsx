"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { useOrganizations } from "@/features/organizations/hooks/use-organizations";

import { OrganizationAccessLoadingState } from "@/features/organizations/components/organization-access-loading-state";

import { createSlug } from "@/features/organizations/utils/slug";

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must contain at least 2 characters.")
    .max(120, "Organization name cannot exceed 120 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Organization slug must contain at least 2 characters.")
    .max(140, "Organization slug cannot exceed 140 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only.",
    ),
});

export default function OrganizationOnboardingPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: isSessionPending,
    error: sessionError,
  } = authClient.useSession();

  const isOrganizationLoadingEnabled =
    !isSessionPending && Boolean(session) && !sessionError;

  const {
    organizations,
    isLoading: isCheckingOrganizations,
    errorMessage: organizationCheckError,
    isSelectingId,
    handleRetry: handleRetryOrganizations,
    activateOrganization,
  } = useOrganizations({
    enabled: isOrganizationLoadingEnabled,
  });

  const automaticActivationStarted = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session || sessionError) {
      router.replace("/login");
    }
  }, [isSessionPending, session, sessionError, router]);

  useEffect(() => {
    if (
      isSessionPending ||
      !session ||
      sessionError ||
      isCheckingOrganizations ||
      organizationCheckError
    ) {
      return;
    }

    if (organizations.length > 1) {
      router.replace("/select-organization");
      return;
    }

    if (organizations.length === 1) {
      const organization = organizations[0];

      if (automaticActivationStarted.current === organization.id) {
        return;
      }

      automaticActivationStarted.current = organization.id;

      void (async () => {
        const activated = await activateOrganization(organization.id);

        if (activated) {
          router.replace("/dashboard");
        }
      })();
    }
  }, [
    isSessionPending,
    session,
    sessionError,
    isCheckingOrganizations,
    organizationCheckError,
    organizations,
    activateOrganization,
    router,
  ]);

  function handleNameChange(value: string) {
    setName(value);

    if (!isSlugEdited) {
      setSlug(createSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setIsSlugEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleRetryOrganizationAccess() {
    if (organizations.length === 1) {
      const activated = await activateOrganization(organizations[0].id);

      if (activated) {
        router.replace("/dashboard");
      }

      return;
    }

    automaticActivationStarted.current = null;
    handleRetryOrganizations();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);

    const validation = organizationSchema.safeParse({
      name,
      slug,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: organization, error } =
        await authClient.organization.create({
          name: validation.data.name,
          slug: validation.data.slug,
          keepCurrentActiveOrganization: false,
        });

      if (error) {
        setErrorMessage(error.message || "Unable to create your organization.");
        return;
      }

      if (!organization) {
        setErrorMessage(
          "Organization creation could not be confirmed. Please try again.",
        );
        return;
      }

      toast.success("Organization created successfully.", {
        description: `${organization.name} is ready to use.`,
      });

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the authentication service. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    isSessionPending ||
    !session ||
    isCheckingOrganizations ||
    (organizations.length > 0 && !organizationCheckError)
  ) {
    return (
      <OrganizationAccessLoadingState
        label={
          isSessionPending
            ? "Checking your account..."
            : isSelectingId
              ? "Opening your organization..."
              : "Checking your organizations..."
        }
      />
    );
  }

  if (organizationCheckError) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div
            role="alert"
            className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-4 py-3 text-sm leading-6"
          >
            {organizationCheckError}
          </div>

          <button
            type="button"
            onClick={() => void handleRetryOrganizationAccess()}
            disabled={isSelectingId !== null || isCheckingOrganizations}
            className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 w-full cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSelectingId ? "Activating organization..." : "Try again"}
          </button>
        </div>
      </main>
    );
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

        <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm sm:p-9">
          <div className="mb-7">
            <p className="text-accent mb-2 text-xs font-semibold tracking-wider uppercase">
              Organization onboarding
            </p>

            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              Set up your organization
            </h1>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Create your organization to start managing your business and
              bookings with Bookwise.
            </p>
          </div>

          <div className="border-border bg-surface-muted mb-6 rounded-lg border px-3.5 py-3">
            <p className="text-muted-foreground text-xs">Signed in as</p>

            <p className="text-foreground mt-1 text-sm font-medium break-all">
              {session.user.email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="organization-name"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Organization name
              </label>

              <input
                id="organization-name"
                name="organizationName"
                type="text"
                autoComplete="organization"
                placeholder="e.g. Acme Dental Clinic"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                required
                maxLength={120}
                disabled={isSubmitting}
                className="border-border bg-surface text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3.5 text-sm transition outline-none focus:ring-2 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="organization-slug"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Organization URL
              </label>

              <div className="border-border bg-surface focus-within:border-primary focus-within:ring-primary/10 flex h-11 items-center overflow-hidden rounded-lg border transition focus-within:ring-2">
                <span className="border-border bg-surface-muted text-muted-foreground flex h-full shrink-0 items-center border-r px-3 text-xs font-medium">
                  bookwise/
                </span>

                <input
                  id="organization-slug"
                  name="organizationSlug"
                  type="text"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder="acme-dental"
                  required
                  maxLength={140}
                  disabled={isSubmitting}
                  className="text-foreground placeholder:text-muted-foreground/70 h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:opacity-60"
                />
              </div>

              <p className="text-muted-foreground mt-2 text-xs leading-5">
                Use lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-3.5 py-3 text-sm leading-6"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary flex h-11 w-full cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating organization..."
                : "Create organization"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </div>

        <p className="text-muted-foreground mt-5 text-center text-xs">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </p>
      </div>
    </main>
  );
}
