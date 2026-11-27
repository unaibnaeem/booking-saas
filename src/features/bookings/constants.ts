import type {
  BookingFilters,
  BookingPeriod,
  BookingScope,
  BookingStatus,
} from "./types";

export const BOOKING_PAGE_SIZE = 20;

export const INITIAL_BOOKING_FILTERS: BookingFilters = {
  status: "",
  from: "",
  to: "",
};

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  CONFIRMED: "bg-success/10 text-success",
  CANCELLED: "bg-surface-muted text-muted-foreground",
  COMPLETED: "bg-accent-soft text-accent",
  NO_SHOW: "bg-danger/10 text-danger",
};

export const BOOKING_SCOPE_OPTIONS: {
  value: BookingScope;
  label: string;
}[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All bookings" },
];

export const BOOKING_PERIOD_OPTIONS: {
  value: BookingPeriod;
  label: string;
}[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This week" },
];
