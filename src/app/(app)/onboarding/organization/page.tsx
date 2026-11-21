"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

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

function createSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export default function OrganizationOnboardingPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: isSessionPending,
    error: sessionError,
  } = authClient.useSession();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createdOrganization, setCreatedOrganization] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  // Onboarding requires an authenticated user.
  useEffect(() => {
    if (!isSessionPending && (!session || sessionError)) {
      router.replace("/login");
    }
  }, [isSessionPending, session, sessionError, router]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const { error } = await authClient.organization.create({
        name: validation.data.name,
        slug: validation.data.slug,
        keepCurrentActiveOrganization: false,
      });

      if (error) {
        setErrorMessage(error.message || "Unable to create your organization.");
        return;
      }

      setCreatedOrganization({
        name: validation.data.name,
        slug: validation.data.slug,
      });
    } catch {
      setErrorMessage(
        "Unable to connect to the authentication service. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSessionPending || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f6] px-4">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f6] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-sm">
              B
            </div>

            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              bookwise
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Simple scheduling. Better business.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-9">
          {createdOrganization ? (
            <div className="py-3 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                ✓
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Organization created!
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your Bookwise organization is ready.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Organization
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {createdOrganization.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {createdOrganization.slug}
                </p>

                <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-emerald-700">
                  You are the owner of this organization.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="mb-2 text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Organization onboarding
                </p>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Set up your organization
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create your organization to start managing your business and
                  bookings with Bookwise.
                </p>
              </div>

              <div className="mb-6 rounded-lg bg-slate-50 px-3.5 py-3">
                <p className="text-xs text-slate-500">Signed in as</p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {session.user.email}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="organization-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Organization name
                  </label>

                  <input
                    id="organization-name"
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. Acme Dental Clinic"
                    value={name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    required
                    maxLength={120}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="organization-slug"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Organization URL
                  </label>

                  <div className="flex h-11 items-center overflow-hidden rounded-lg border border-slate-300 bg-white transition focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
                    <span className="flex h-full items-center border-r border-slate-200 bg-slate-50 px-3 text-xs text-slate-500">
                      bookwise/
                    </span>

                    <input
                      id="organization-slug"
                      type="text"
                      value={slug}
                      onChange={(event) => handleSlugChange(event.target.value)}
                      placeholder="acme-dental"
                      required
                      maxLength={140}
                      className="h-full min-w-0 flex-1 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Use lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Creating organization..."
                    : "Create organization"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            Back to sign in
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Bookwise. All rights reserved.
        </p>
      </div>
    </main>
  );
}
