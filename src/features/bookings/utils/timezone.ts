import { TZDate } from "@date-fns/tz";

import type { BookingPeriod } from "../types";

export type BookingDateRange = {
  from: Date;
  to: Date;
};

/**
 * Calculates an organization's calendar period as UTC boundaries.
 *
 * The start is inclusive.
 * The end is exclusive.
 *
 * Week starts on Monday (ISO weekday convention).
 */
export function getBookingPeriodRange(
  period: BookingPeriod,
  timeZone: string,
  now: Date = new Date(),
): BookingDateRange {
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError("Invalid current date.");
  }

  // Validate the IANA timezone.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new RangeError(`Invalid timezone: ${timeZone}`);
  }

  // Interpret the current instant in the organization's timezone.
  const zonedNow = new TZDate(now.getTime(), timeZone);

  // Create midnight at the start of the organization's current day.
  const start = new TZDate(
    zonedNow.getFullYear(),
    zonedNow.getMonth(),
    zonedNow.getDate(),
    timeZone,
  );

  const end = new TZDate(start.getTime(), timeZone);

  switch (period) {
    case "today": {
      end.setDate(end.getDate() + 1);
      break;
    }

    case "tomorrow": {
      start.setDate(start.getDate() + 1);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 1);
      break;
    }

    case "this-week": {
      // Monday = 0, Tuesday = 1, ..., Sunday = 6.
      const daysSinceMonday = (start.getDay() + 6) % 7;

      start.setDate(start.getDate() - daysSinceMonday);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      break;
    }
  }

  // Return ordinary Date instances for Prisma.
  return {
    from: new Date(start.getTime()),
    to: new Date(end.getTime()),
  };
}
