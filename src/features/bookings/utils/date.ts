import { TZDate } from "@date-fns/tz";

export function getLocalDateStart(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getZonedDate(value: string, timeZone: string): TZDate {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new RangeError("Invalid date.");
  }

  return new TZDate(timestamp, timeZone);
}

export function getDateInTimeZone(value: string, timeZone: string): string {
  const date = getZonedDate(value, timeZone);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTimeInTimeZone(value: string, timeZone: string): string {
  const date = getZonedDate(value, timeZone);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function createDateTimeInTimeZone(
  dateValue: string,
  timeValue: string,
  timeZone: string,
): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    throw new RangeError("Invalid appointment date or time.");
  }

  const [, yearValue, monthValue, dayValue] = dateMatch;
  const [, hourValue, minuteValue] = timeMatch;

  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  // Interpret the selected wall-clock time in the organization's timezone.
  const zonedDate = new TZDate(year, month - 1, day, hour, minute, 0, timeZone);

  // Reject invalid dates and nonexistent local times during DST transitions.
  if (
    zonedDate.getFullYear() !== year ||
    zonedDate.getMonth() !== month - 1 ||
    zonedDate.getDate() !== day ||
    zonedDate.getHours() !== hour ||
    zonedDate.getMinutes() !== minute
  ) {
    throw new RangeError(
      "The selected appointment time is invalid in the organization's timezone.",
    );
  }

  return new Date(zonedDate.getTime());
}

// export function getLocalDateStart(value: string): Date {
//   const [year, month, day] = value.split("-").map(Number);

//   return new Date(year, month - 1, day);
// }
