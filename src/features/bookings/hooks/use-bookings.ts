"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";

import type {
  Booking,
  BookingErrorResponse,
  BookingFilters,
  BookingListResponse,
  BookingPeriod,
  BookingScope,
  BookingStatus,
  Pagination,
} from "@/features/bookings/types";

import {
  BOOKING_PAGE_SIZE,
  INITIAL_BOOKING_FILTERS,
} from "@/features/bookings/constants";

import { getLocalDateStart } from "@/features/bookings/utils/date";
import { groupUpcomingBookings } from "@/features/bookings/utils/group";

type UseBookingsOptions = {
  scope: BookingScope;
  period?: BookingPeriod;
};

export function useBookings({ scope, period }: UseBookingsOptions) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeZone, setTimeZone] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: BOOKING_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [draftStatus, setDraftStatus] = useState<BookingStatus | "">("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(
    INITIAL_BOOKING_FILTERS,
  );

  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(BOOKING_PAGE_SIZE),
      scope,
    });

    if (period) {
      params.set("period", period);
    }

    if (appliedFilters.status) {
      params.set("status", appliedFilters.status);
    }

    if (appliedFilters.from) {
      params.set("from", getLocalDateStart(appliedFilters.from).toISOString());
    }

    if (appliedFilters.to) {
      const endDate = getLocalDateStart(appliedFilters.to);
      endDate.setDate(endDate.getDate() + 1);

      params.set("to", endDate.toISOString());
    }

    return params.toString();
  }, [page, appliedFilters, scope, period]);

  const bookingGroups = useMemo(() => {
    if (scope !== "upcoming") {
      return bookings.length > 0
        ? [
            {
              key: "all",
              label: "",
              bookings,
            },
          ]
        : [];
    }

    return groupUpcomingBookings(bookings, timeZone);
  }, [bookings, scope, timeZone]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      try {
        const response = await fetch(`/api/bookings?${queryString}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload: unknown = await response.json();

        if (!response.ok) {
          const apiError = payload as BookingErrorResponse;

          throw new Error(
            apiError.error?.message || "Unable to retrieve bookings.",
          );
        }

        const result = payload as BookingListResponse;

        if (
          !result.data ||
          !Array.isArray(result.data.bookings) ||
          !result.data.pagination ||
          typeof result.data.timeZone !== "string"
        ) {
          throw new Error("The server returned an invalid response.");
        }

        if (!cancelled) {
          setBookings(result.data.bookings);
          setPagination(result.data.pagination);
          setTimeZone(result.data.timeZone);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading bookings.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [queryString, retryKey]);

  function handleApplyFilters(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setValidationMessage(null);

    if (draftFrom && draftTo && draftFrom > draftTo) {
      setValidationMessage("The end date must be on or after the start date.");
      return;
    }

    setIsLoading(true);
    setPage(1);

    setAppliedFilters({
      status: draftStatus,
      from: draftFrom,
      to: draftTo,
    });

    setRetryKey((current) => current + 1);
  }

  function handleClearFilters() {
    setDraftStatus("");
    setDraftFrom("");
    setDraftTo("");
    setValidationMessage(null);

    setIsLoading(true);
    setPage(1);

    setAppliedFilters(INITIAL_BOOKING_FILTERS);
    setRetryKey((current) => current + 1);
  }

  function handleRetry() {
    setErrorMessage(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages || isLoading) {
      return;
    }

    setIsLoading(true);
    setPage(nextPage);
  }

  function prepareForQueryChange() {
    setPage(1);
    setIsLoading(true);
    setErrorMessage(null);
  }

  return {
    bookings,
    timeZone,
    pagination,
    bookingGroups,

    draftStatus,
    setDraftStatus,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    appliedFilters,

    page,
    isLoading,
    errorMessage,
    validationMessage,

    handleApplyFilters,
    handleClearFilters,
    handleRetry,
    handlePageChange,
    prepareForQueryChange,
  };
}
