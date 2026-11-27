"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { SelectChevron } from "@/components/ui/select-chevron";

import type {
  BookingFilters,
  BookingPeriod,
  BookingScope,
  BookingStatus,
} from "@/features/bookings/types";

import {
  BOOKING_SCOPE_OPTIONS,
  BOOKING_PERIOD_OPTIONS,
} from "@/features/bookings/constants";

type BookingToolbarProps = {
  scope: BookingScope;
  period?: BookingPeriod;

  appliedFilters: BookingFilters;

  draftStatus: BookingStatus | "";
  draftFrom: string;
  draftTo: string;

  validationMessage: string | null;
  isLoading: boolean;

  onScopeChange: (scope: BookingScope) => void;
  onPeriodChange: (period?: BookingPeriod) => void;

  onDraftStatusChange: (status: BookingStatus | "") => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;

  onApplyFilters: (event: SubmitEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
};

export function BookingToolbar({
  scope,
  period,
  appliedFilters,
  draftStatus,
  draftFrom,
  draftTo,
  validationMessage,
  isLoading,
  onScopeChange,
  onPeriodChange,
  onDraftStatusChange,
  onDraftFromChange,
  onDraftToChange,
  onApplyFilters,
  onClearFilters,
}: BookingToolbarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [
    appliedFilters.status,
    appliedFilters.from,
    appliedFilters.to,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!isFiltersOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsFiltersOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFiltersOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFiltersOpen]);

  function handleFilterSubmit(event: SubmitEvent<HTMLFormElement>) {
    onApplyFilters(event);
    setIsFiltersOpen(false);
  }

  function handleFilterClear() {
    onClearFilters();
    setIsFiltersOpen(false);
  }

  return (
    <section className="border-border relative z-20 mb-5 space-y-3 border-b pb-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Booking scope"
          className="flex flex-wrap items-center gap-1"
        >
          {BOOKING_SCOPE_OPTIONS.map((option) => {
            const isActive = scope === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onScopeChange(option.value)}
                aria-pressed={isActive}
                className={`focus-visible:outline-primary h-9 cursor-pointer rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? "bg-accent-soft text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {option.value === "all" ? "All" : option.label}
              </button>
            );
          })}
        </div>

        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsFiltersOpen((current) => !current)}
            aria-expanded={isFiltersOpen}
            aria-controls="booking-filters-panel"
            className="border-border bg-surface text-foreground hover:bg-surface-muted flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>
            More filters
            {activeFilterCount > 0 && (
              <span className="bg-accent-soft text-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
            <SelectChevron
              className={`text-muted-foreground size-4 transition-transform ${
                isFiltersOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isFiltersOpen && (
            <div
              id="booking-filters-panel"
              className="border-border bg-surface absolute left-0 z-30 mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-xl border p-4 shadow-lg sm:right-0 sm:left-auto sm:p-5"
            >
              <div className="mb-4">
                <h2 className="text-foreground text-sm font-semibold">
                  Filter bookings
                </h2>

                <p className="text-muted-foreground mt-1 text-xs">
                  Narrow your bookings by status and scheduled date.
                </p>
              </div>

              <form onSubmit={handleFilterSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-status"
                      className="text-foreground mb-2 block text-xs font-medium"
                    >
                      Status
                    </label>

                    <div className="relative">
                      <select
                        id="booking-status"
                        value={draftStatus}
                        onChange={(event) =>
                          onDraftStatusChange(
                            event.target.value as BookingStatus | "",
                          )
                        }
                        className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full appearance-none rounded-lg border py-2 pr-10 pl-3 text-sm outline-none focus:ring-2"
                      >
                        <option value="">All statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="NO_SHOW">No show</option>
                      </select>

                      <SelectChevron className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-from"
                      className="text-foreground mb-2 block text-xs font-medium"
                    >
                      From date
                    </label>

                    <input
                      id="booking-from"
                      type="date"
                      value={draftFrom}
                      onChange={(event) =>
                        onDraftFromChange(event.target.value)
                      }
                      className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-to"
                      className="text-foreground mb-2 block text-xs font-medium"
                    >
                      To date
                    </label>

                    <input
                      id="booking-to"
                      type="date"
                      min={draftFrom || undefined}
                      value={draftTo}
                      onChange={(event) => onDraftToChange(event.target.value)}
                      className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 flex-1 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Apply filters
                    </button>

                    <button
                      type="button"
                      onClick={handleFilterClear}
                      disabled={isLoading}
                      className="border-border bg-surface text-foreground hover:bg-surface-muted h-11 cursor-pointer rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {validationMessage && (
                  <p role="alert" className="text-danger mt-4 text-sm">
                    {validationMessage}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {scope === "upcoming" && (
        <div className="border-border/60 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-muted-foreground mr-1 text-xs font-medium">
            Date:
          </span>

          {BOOKING_PERIOD_OPTIONS.map((option) => {
            const isActive = period === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPeriodChange(option.value)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-accent-soft text-primary"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                }`}
              >
                {option.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPeriodChange(undefined)}
            aria-pressed={!period}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              !period
                ? "border-accent bg-accent-soft text-primary"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            Any date
          </button>
        </div>
      )}
    </section>
  );
}
