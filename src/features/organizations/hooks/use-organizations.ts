"use client";

import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

import type { OrganizationOption } from "@/features/organizations/types";

type UseOrganizationsOptions = {
  enabled?: boolean;
};

export function useOrganizations({
  enabled = true,
}: UseOrganizationsOptions = {}) {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSelectingId, setIsSelectingId] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadOrganizations() {
      try {
        const { data, error } = await authClient.organization.list();

        if (cancelled) {
          return;
        }

        if (error) {
          throw new Error(
            error.message || "Unable to load your organizations.",
          );
        }

        const availableOrganizations: OrganizationOption[] = (data ?? []).map(
          (organization) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }),
        );

        setOrganizations(availableOrganizations);
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your organizations.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [enabled, retryKey]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryKey((current) => current + 1);
  }, []);

  const activateOrganization = useCallback(
    async (organizationId: string): Promise<boolean> => {
      if (isSelectingId !== null) {
        return false;
      }

      setErrorMessage(null);
      setIsSelectingId(organizationId);

      try {
        const { error } = await authClient.organization.setActive({
          organizationId,
        });

        if (error) {
          setErrorMessage(
            error.message || "Unable to select this organization.",
          );

          return false;
        }

        return true;
      } catch {
        setErrorMessage(
          "Unable to select your organization. Please try again.",
        );

        return false;
      } finally {
        setIsSelectingId(null);
      }
    },
    [isSelectingId],
  );

  return {
    organizations,
    isLoading,
    errorMessage,
    isSelectingId,
    handleRetry,
    activateOrganization,
  };
}
