import Link from "next/link";

import { BookingViewSwitcher, type BookingView } from "./booking-view-switcher";

type BookingPageHeaderProps = {
  view: BookingView;
  totalBookings: number;
  onViewChange: (view: BookingView) => void;
};

export function BookingPageHeader({
  view,
  totalBookings,
  onViewChange,
}: BookingPageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-accent text-xs font-semibold tracking-wider uppercase">
          Scheduling
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Bookings
          </h1>

          {view === "list" && (
            <span className="text-muted-foreground bg-surface-muted rounded-full px-2.5 py-1 text-xs font-medium">
              {totalBookings} {totalBookings === 1 ? "booking" : "bookings"}
            </span>
          )}
        </div>

        <p className="text-muted-foreground mt-1.5 text-sm">
          View and manage your organization&apos;s appointments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BookingViewSwitcher view={view} onViewChange={onViewChange} />

        <Link
          href="/bookings/new"
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors"
        >
          + Create Booking
        </Link>
      </div>
    </header>
  );
}
