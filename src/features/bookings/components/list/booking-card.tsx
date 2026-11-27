import Link from "next/link";

import type { Booking } from "@/features/bookings/types";

import { BOOKING_STATUS_STYLES } from "@/features/bookings/constants";

import {
  formatDateTime,
  formatPrice,
  formatStatus,
} from "@/features/bookings/utils/format";

type BookingCardProps = {
  booking: Booking;
  timeZone: string;
};

export function BookingCard({ booking, timeZone }: BookingCardProps) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      aria-label={`View booking for ${booking.customer.name}`}
      className="border-border bg-surface hover:border-sage focus-visible:outline-primary block rounded-2xl border p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-foreground text-base font-semibold">
              {booking.customer.name}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                BOOKING_STATUS_STYLES[booking.status]
              }`}
            >
              {formatStatus(booking.status)}
            </span>
          </div>

          <p className="text-muted-foreground mt-1 text-sm break-all">
            {booking.customer.email}
          </p>

          <div className="border-border mt-5 border-t pt-4">
            <p className="text-foreground text-sm font-medium">
              {booking.serviceName}
            </p>

            <p className="text-muted-foreground mt-1 text-xs">
              {booking.serviceDurationMinutes} minutes
            </p>
          </div>
        </div>

        <div className="flex flex-row justify-between gap-5 sm:min-w-56 sm:flex-col sm:items-end">
          <div className="sm:text-right">
            <p className="text-foreground text-sm font-medium">
              {formatDateTime(booking.startsAt, timeZone)}
            </p>

            <p className="text-muted-foreground mt-1 text-xs">
              Ends {formatDateTime(booking.endsAt, timeZone)}
            </p>
          </div>

          <p className="text-foreground text-sm font-semibold">
            {formatPrice(booking.priceAmount, booking.currencyCode)}
          </p>
        </div>
      </div>
    </Link>
  );
}
