"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TZDate } from "@date-fns/tz";

import type {
  Booking,
  BookingErrorResponse,
  BookingListResponse,
  BookingStatus,
} from "@/features/bookings/types";

type BookingCalendarProps = {
  timeZone: string;
};

type CalendarMonth = {
  year: number;
  month: number;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "border-warning/20 bg-warning/10 text-warning",
  CONFIRMED: "border-success/20 bg-success/10 text-success",
  CANCELLED: "border-border bg-surface-muted text-muted-foreground",
  COMPLETED: "border-accent/20 bg-accent-soft text-accent",
  NO_SHOW: "border-danger/20 bg-danger/10 text-danger",
};

function formatDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to calculate calendar date.");
  }

  return `${year}-${month}-${day}`;
}

function formatTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export function BookingCalendar({ timeZone }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<CalendarMonth | null>(null);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new TZDate(Date.now(), timeZone);

      setCurrentMonth({
        year: now.getFullYear(),
        month: now.getMonth(),
      });

      setTodayKey(formatDateKey(now, timeZone));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [timeZone]);

  const calendarRange = useMemo(() => {
    if (!currentMonth) {
      return null;
    }

    const firstDay = new TZDate(
      currentMonth.year,
      currentMonth.month,
      1,
      timeZone,
    );

    const mondayOffset = (firstDay.getDay() + 6) % 7;

    const startDate = new TZDate(firstDay.getTime(), timeZone);
    startDate.setDate(startDate.getDate() - mondayOffset);

    const dates = Array.from({ length: 42 }, (_, index) => {
      const date = new TZDate(startDate.getTime(), timeZone);
      date.setDate(date.getDate() + index);

      return date;
    });

    const endDateExclusive = new TZDate(startDate.getTime(), timeZone);
    endDateExclusive.setDate(endDateExclusive.getDate() + 42);

    return {
      dates,
      startDate: new Date(startDate.getTime()),
      endDateExclusive: new Date(endDateExclusive.getTime()),
    };
  }, [currentMonth, timeZone]);

  const from = calendarRange?.startDate.toISOString();
  const to = calendarRange?.endDateExclusive.toISOString();

  useEffect(() => {
    if (from === undefined || to === undefined) {
      return;
    }

    const rangeFrom = from;
    const rangeTo = to;

    const controller = new AbortController();

    async function loadBookings() {
      try {
        const params = new URLSearchParams();

        params.set("page", "1");
        params.set("limit", "100");
        params.set("from", rangeFrom);
        params.set("to", rangeTo);

        const firstResponse = await fetch(
          `/api/bookings?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const firstPayload: unknown = await firstResponse.json();

        if (!firstResponse.ok) {
          const apiError = firstPayload as BookingErrorResponse;

          throw new Error(
            apiError.error?.message || "Unable to load calendar bookings.",
          );
        }

        const firstResult = firstPayload as BookingListResponse;

        if (
          !firstResult.data ||
          !Array.isArray(firstResult.data.bookings) ||
          !firstResult.data.pagination
        ) {
          throw new Error("The server returned an invalid response.");
        }

        const allBookings = [...firstResult.data.bookings];

        for (
          let page = 2;
          page <= firstResult.data.pagination.totalPages;
          page++
        ) {
          params.set("page", String(page));

          const response = await fetch(`/api/bookings?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          });

          const payload: unknown = await response.json();

          if (!response.ok) {
            const apiError = payload as BookingErrorResponse;

            throw new Error(
              apiError.error?.message || "Unable to load calendar bookings.",
            );
          }

          const result = payload as BookingListResponse;

          if (!result.data || !Array.isArray(result.data.bookings)) {
            throw new Error("The server returned an invalid response.");
          }

          allBookings.push(...result.data.bookings);
        }

        if (!controller.signal.aborted) {
          setBookings(allBookings);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading bookings.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      controller.abort();
    };
  }, [from, to, retryKey]);

  const bookingsByDate = useMemo(() => {
    const groups: Record<string, Booking[]> = {};

    for (const booking of bookings) {
      const dateKey = formatDateKey(new Date(booking.startsAt), timeZone);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(booking);
    }

    for (const dateBookings of Object.values(groups)) {
      dateBookings.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }

    return groups;
  }, [bookings, timeZone]);

  const monthLabel = currentMonth
    ? new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        timeZone,
      }).format(new TZDate(currentMonth.year, currentMonth.month, 1, timeZone))
    : "";

  function navigateMonth(direction: -1 | 1) {
    if (!currentMonth) {
      return;
    }

    const nextMonth = new TZDate(
      currentMonth.year,
      currentMonth.month + direction,
      1,
      timeZone,
    );

    setIsLoading(true);
    setErrorMessage(null);

    setCurrentMonth({
      year: nextMonth.getFullYear(),
      month: nextMonth.getMonth(),
    });
  }

  function goToToday() {
    const now = new TZDate(Date.now(), timeZone);

    setTodayKey(formatDateKey(now, timeZone));

    const isAlreadyCurrentMonth =
      currentMonth?.year === now.getFullYear() &&
      currentMonth?.month === now.getMonth();

    if (!isAlreadyCurrentMonth) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    setCurrentMonth({
      year: now.getFullYear(),
      month: now.getMonth(),
    });
  }

  function handleRetry() {
    setErrorMessage(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  return (
    <section className="border-border bg-surface overflow-hidden rounded-2xl border">
      <div className="border-border flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {monthLabel}
          </h2>

          <p className="text-muted-foreground mt-1 text-xs">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
            in visible period
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            disabled={isLoading || !currentMonth}
            className="border-border bg-surface text-foreground hover:bg-surface-muted h-9 cursor-pointer rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            disabled={isLoading || !currentMonth}
            aria-label="Previous month"
            className="border-border bg-surface text-foreground hover:bg-surface-muted flex size-9 cursor-pointer items-center justify-center rounded-lg border text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => navigateMonth(1)}
            disabled={isLoading || !currentMonth}
            aria-label="Next month"
            className="border-border bg-surface text-foreground hover:bg-surface-muted flex size-9 cursor-pointer items-center justify-center rounded-lg border text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>

      {isLoading || !calendarRange || !currentMonth ? (
        <div className="text-muted-foreground px-5 py-20 text-center text-sm">
          Loading calendar...
        </div>
      ) : errorMessage ? (
        <div className="px-5 py-16 text-center">
          <p className="text-danger text-sm font-medium">
            Unable to load calendar
          </p>

          <p className="text-muted-foreground mt-2 text-sm">{errorMessage}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="bg-primary text-primary-foreground hover:bg-primary-hover mt-5 h-10 cursor-pointer rounded-lg px-5 text-sm font-semibold transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-190">
            <div className="border-border grid grid-cols-7 border-b">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-muted-foreground px-3 py-3 text-center text-xs font-semibold"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarRange.dates.map((date) => {
                const dateKey = formatDateKey(date, timeZone);
                const dateBookings = bookingsByDate[dateKey] ?? [];

                const isCurrentMonth =
                  date.getMonth() === currentMonth.month &&
                  date.getFullYear() === currentMonth.year;

                const isToday = dateKey === todayKey;

                return (
                  <div
                    key={dateKey}
                    aria-label={`${dateKey}, ${dateBookings.length} bookings`}
                    className={`border-border min-h-32 border-r border-b p-2 ${
                      !isCurrentMonth ? "bg-surface-muted/50" : "bg-surface"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dateBookings.length > 0 && (
                        <span className="text-muted-foreground text-[10px]">
                          {dateBookings.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {dateBookings.slice(0, 3).map((booking) => (
                        <Link
                          key={booking.id}
                          href={`/bookings/${booking.id}`}
                          title={`${booking.customer.name} · ${booking.serviceName}`}
                          aria-label={`View ${booking.serviceName} booking for ${booking.customer.name}`}
                          className={`focus-visible:outline-primary block overflow-hidden rounded-md border px-1.5 py-1 text-[10px] leading-4 transition-opacity hover:opacity-80 focus-visible:outline-2 ${statusStyles[booking.status]}`}
                        >
                          <p className="truncate font-semibold">
                            {formatTime(booking.startsAt, timeZone)}{" "}
                            {booking.customer.name}
                          </p>

                          <p className="truncate opacity-80">
                            {booking.serviceName}
                          </p>
                        </Link>
                      ))}

                      {dateBookings.length > 3 && (
                        <p className="text-muted-foreground px-1 text-[10px] font-medium">
                          +{dateBookings.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && bookings.length === 0 && (
        <div className="border-border border-t px-5 py-4">
          <p className="text-muted-foreground text-center text-xs">
            No bookings in this calendar period.
          </p>
        </div>
      )}
    </section>
  );
}
