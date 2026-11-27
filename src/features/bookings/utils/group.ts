import { TZDate } from "@date-fns/tz";

import type { Booking } from "../types";

export type UpcomingBookingGroupKey =
  "today" | "tomorrow" | "this-week" | "later";

export type UpcomingBookingGroup = {
  key: UpcomingBookingGroupKey;
  label: string;
  bookings: Booking[];
};

function getDateKey(date: Date, timeZone: string): string {
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
    throw new Error("Unable to calculate booking date.");
  }

  return `${year}-${month}-${day}`;
}

export function groupUpcomingBookings(
  bookings: Booking[],
  timeZone: string,
  now: Date = new Date(),
): UpcomingBookingGroup[] {
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError("Invalid current date.");
  }

  // Validate the organization's timezone.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new RangeError(`Invalid timezone: ${timeZone}`);
  }

  // Get today's date in the organization's timezone.
  const today = new TZDate(now.getTime(), timeZone);
  today.setHours(0, 0, 0, 0);

  // Calculate tomorrow using calendar arithmetic.
  const tomorrow = new TZDate(today.getTime(), timeZone);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate the current week's Sunday.
  const sunday = new TZDate(today.getTime(), timeZone);
  const daysUntilSunday = (7 - sunday.getDay()) % 7;
  sunday.setDate(sunday.getDate() + daysUntilSunday);

  const todayKey = getDateKey(new Date(today.getTime()), timeZone);

  const tomorrowKey = getDateKey(new Date(tomorrow.getTime()), timeZone);

  const sundayKey = getDateKey(new Date(sunday.getTime()), timeZone);

  const groups: Record<UpcomingBookingGroupKey, Booking[]> = {
    today: [],
    tomorrow: [],
    "this-week": [],
    later: [],
  };

  for (const booking of bookings) {
    const bookingDateKey = getDateKey(new Date(booking.startsAt), timeZone);

    if (bookingDateKey === todayKey) {
      groups.today.push(booking);
    } else if (bookingDateKey === tomorrowKey) {
      groups.tomorrow.push(booking);
    } else if (bookingDateKey <= sundayKey) {
      groups["this-week"].push(booking);
    } else {
      groups.later.push(booking);
    }
  }

  const groupDefinitions: {
    key: UpcomingBookingGroupKey;
    label: string;
  }[] = [
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "this-week", label: "This week" },
    { key: "later", label: "Later" },
  ];

  // Don't display empty date groups.
  return groupDefinitions
    .filter((group) => groups[group.key].length > 0)
    .map((group) => ({
      ...group,
      bookings: groups[group.key],
    }));
}
