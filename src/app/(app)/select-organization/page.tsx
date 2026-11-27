"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOrganizations } from "@/features/organizations/hooks/use-organizations";

import { OrganizationList } from "@/features/organizations/components/organization-list";
import { OrganizationLoadingState } from "@/features/organizations/components/organization-loading-state";

export default function SelectOrganizationPage() {
  const router = useRouter();

  const {
    organizations,
    isLoading,
    errorMessage,
    isSelectingId,
    handleRetry,
    activateOrganization,
  } = useOrganizations();

  useEffect(() => {
    if (!isLoading && !errorMessage && organizations.length === 0) {
      router.replace("/onboarding/organization");
    }
  }, [isLoading, errorMessage, organizations.length, router]);

  async function handleSelectOrganization(organizationId: string) {
    const activated = await activateOrganization(organizationId);

    if (activated) {
      router.replace("/dashboard");
    }
  }

  if (isLoading) {
    return (
      <main className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <OrganizationLoadingState />
        </div>
      </main>
    );
  }

  if (!errorMessage && organizations.length === 0) {
    return (
      <main className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">
          Redirecting to organization setup...
        </p>
      </main>
    );
  }

  return (
    <main className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-accent mb-2 text-xs font-semibold tracking-wider uppercase">
            Workspace selection
          </p>

          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Choose your organization
          </h1>

          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Select the workspace you want to manage. Your bookings, customers,
            and services will be scoped to that organization.
          </p>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm sm:p-7">
          {errorMessage ? (
            <div role="alert" className="space-y-4">
              <p className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-3.5 py-3 text-sm leading-6">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isSelectingId !== null}
                className="bg-primary text-primary-foreground hover:bg-primary-hover flex h-11 w-full cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          ) : (
            <OrganizationList
              organizations={organizations}
              isSelectingId={isSelectingId}
              onSelect={(organizationId) => {
                void handleSelectOrganization(organizationId);
              }}
            />
          )}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
          You can switch organizations later from your Bookwise workspace.
        </p>
      </section>
    </main>
  );
}
