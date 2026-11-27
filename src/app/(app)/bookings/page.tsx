"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useBookings } from "@/features/bookings/hooks/use-bookings";

import { BookingPageHeader } from "@/features/bookings/components/list/booking-page-header";
import { BookingToolbar } from "@/features/bookings/components/list/booking-toolbar";
import { BookingList } from "@/features/bookings/components/list/booking-list";
import { BookingCalendar } from "@/features/bookings/components/calendar/booking-calendar";
import { BookingPagination } from "@/features/bookings/components/list/booking-pagination";
import { BookingEmptyState } from "@/features/bookings/components/list/booking-empty-state";
import { BookingListFeedback } from "@/features/bookings/components/list/booking-list-feedback";
import { BookingListSkeleton } from "@/features/bookings/components/list/booking-list-skeleton";

import type { BookingScope, BookingPeriod } from "@/features/bookings/types";

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") === "calendar" ? "calendar" : "list";

  const scopeParam = searchParams.get("scope");

  const scope: BookingScope =
    scopeParam === "upcoming" ||
    scopeParam === "past" ||
    scopeParam === "cancelled" ||
    scopeParam === "all"
      ? scopeParam
      : "all";

  const periodParam = searchParams.get("period");

  const period: BookingPeriod | undefined =
    scope === "upcoming" &&
    (periodParam === "today" ||
      periodParam === "tomorrow" ||
      periodParam === "this-week")
      ? periodParam
      : undefined;

  const {
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
  } = useBookings({ scope, period });

  function handleViewChange(nextView: "list" | "calendar") {
    const params = new URLSearchParams(searchParams.toString());

    if (nextView === "calendar") {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }

    const query = params.toString();

    router.replace(query ? `/bookings?${query}` : "/bookings", {
      scroll: false,
    });
  }

  function handleScopeChange(nextScope: BookingScope) {
    if (nextScope === scope) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("scope", nextScope);
    params.delete("period");

    prepareForQueryChange();

    const query = params.toString();

    router.replace(query ? `/bookings?${query}` : "/bookings", {
      scroll: false,
    });
  }

  function handlePeriodChange(nextPeriod?: BookingPeriod) {
    if (nextPeriod === period) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("scope", "upcoming");

    if (nextPeriod) {
      params.set("period", nextPeriod);
    } else {
      params.delete("period");
    }

    prepareForQueryChange();

    const query = params.toString();

    router.replace(query ? `/bookings?${query}` : "/bookings", {
      scroll: false,
    });
  }

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BookingPageHeader
          view={view}
          totalBookings={pagination.total}
          onViewChange={handleViewChange}
        />

        {view === "calendar" ? (
          !timeZone ? (
            isLoading ? (
              <div className="border-border bg-surface rounded-2xl border px-5 py-16 text-center">
                <p className="text-muted-foreground text-sm">
                  Loading calendar settings...
                </p>
              </div>
            ) : (
              <div className="border-danger/20 bg-danger/5 rounded-2xl border p-6 text-center">
                <p className="text-danger text-sm font-medium">
                  Unable to load calendar settings
                </p>

                <p className="text-muted-foreground mt-2 text-sm">
                  {errorMessage ||
                    "The organization's timezone could not be retrieved."}
                </p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover mt-5 h-10 cursor-pointer rounded-lg px-5 text-sm font-semibold transition-colors"
                >
                  Try again
                </button>
              </div>
            )
          ) : (
            <BookingCalendar timeZone={timeZone} />
          )
        ) : (
          <>
            <BookingToolbar
              scope={scope}
              period={period}
              appliedFilters={appliedFilters}
              draftStatus={draftStatus}
              draftFrom={draftFrom}
              draftTo={draftTo}
              validationMessage={validationMessage}
              isLoading={isLoading}
              onScopeChange={handleScopeChange}
              onPeriodChange={handlePeriodChange}
              onDraftStatusChange={setDraftStatus}
              onDraftFromChange={setDraftFrom}
              onDraftToChange={setDraftTo}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />

            {isLoading ? (
              <BookingListSkeleton showGroupHeading={scope === "upcoming"} />
            ) : errorMessage ? (
              <BookingListFeedback
                errorMessage={errorMessage}
                onRetry={handleRetry}
              />
            ) : bookings.length === 0 ? (
              <BookingEmptyState />
            ) : (
              <BookingList groups={bookingGroups} timeZone={timeZone} />
            )}

            {!isLoading && !errorMessage && pagination.total > 0 && (
              <BookingPagination
                pagination={pagination}
                page={page}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="bg-background min-h-[calc(100vh-4rem)]"
          aria-busy="true"
          aria-label="Loading bookings page"
        >
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="space-y-3">
                <div className="bg-surface-muted h-8 w-48 animate-pulse rounded-md" />
                <div className="bg-surface-muted h-4 w-64 max-w-full animate-pulse rounded-md" />
              </div>

              <div className="flex gap-2">
                <div className="bg-surface-muted h-10 w-24 animate-pulse rounded-lg" />
                <div className="bg-surface-muted h-10 w-32 animate-pulse rounded-lg" />
              </div>
            </div>

            <div className="border-border mb-5 space-y-4 border-b pb-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="bg-surface-muted h-9 w-20 animate-pulse rounded-lg"
                    />
                  ))}
                </div>

                <div className="bg-surface-muted h-9 w-32 animate-pulse rounded-lg" />
              </div>

              <div className="flex gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-surface-muted h-7 w-20 animate-pulse rounded-full"
                  />
                ))}
              </div>
            </div>

            <BookingListSkeleton />
          </div>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}
