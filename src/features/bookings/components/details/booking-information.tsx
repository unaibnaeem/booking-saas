import type { BookingDetails } from "@/features/bookings/types";

import { formatDateTime, formatPrice } from "@/features/bookings/utils/format";

import { BookingStatusBadge } from "../shared/booking-status-badge";

type BookingInformationProps = {
  booking: BookingDetails;
  timeZone: string;
};

function InformationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-foreground mt-1.5 text-sm font-medium wrap-break-word">
        {value}
      </p>
    </div>
  );
}

export function BookingInformation({
  booking,
  timeZone,
}: BookingInformationProps) {
  return (
    <div className="mt-6 space-y-5 sm:mt-7">
      <section className="border-border bg-surface overflow-hidden rounded-2xl border">
        <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium">
              Scheduled service
            </p>

            <h2 className="text-foreground mt-1 text-lg font-semibold wrap-break-word sm:text-xl">
              {booking.serviceName}
            </h2>
          </div>

          <div className="flex shrink-0 items-center">
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:gap-6 sm:p-7 lg:grid-cols-3">
          <div className="bg-surface-muted rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-medium">Starts</p>

            <p className="text-foreground mt-2 text-sm leading-6 font-semibold">
              {formatDateTime(booking.startsAt, timeZone)}
            </p>
          </div>

          <div className="bg-surface-muted rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-medium">Ends</p>

            <p className="text-foreground mt-2 text-sm leading-6 font-semibold">
              {formatDateTime(booking.endsAt, timeZone)}
            </p>
          </div>

          <div className="border-border flex flex-col justify-center rounded-xl border p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-muted-foreground text-xs font-medium">
              Booking price
            </p>

            <p className="text-primary mt-2 text-2xl font-bold tracking-tight">
              {formatPrice(booking.priceAmount, booking.currencyCode)}
            </p>

            <p className="text-muted-foreground mt-1 text-xs">
              {booking.serviceDurationMinutes} minutes
            </p>
          </div>
        </div>

        <div className="border-border border-t px-5 py-3 sm:px-7">
          <p className="text-muted-foreground text-xs wrap-break-word">
            All appointment times are displayed in{" "}
            <span className="text-foreground font-medium">{timeZone}</span>.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="border-border bg-surface min-w-0 rounded-2xl border p-5 sm:p-6">
          <div className="border-border flex items-center gap-3 border-b pb-4">
            <div className="bg-accent-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">
              {booking.customer.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="text-foreground text-sm font-semibold">
                Customer information
              </h2>

              <p className="text-muted-foreground mt-0.5 text-xs">
                Contact details
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <InformationField
              label="Customer name"
              value={booking.customer.name}
            />

            <InformationField
              label="Email address"
              value={booking.customer.email || "No email provided"}
            />

            <InformationField
              label="Phone number"
              value={booking.customer.phone || "No phone provided"}
            />
          </div>
        </section>

        <section className="border-border bg-surface min-w-0 rounded-2xl border p-5 sm:p-6">
          <div className="border-border flex items-center gap-3 border-b pb-4">
            <div className="bg-accent-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-lg">
              ◷
            </div>

            <div className="min-w-0">
              <h2 className="text-foreground text-sm font-semibold">
                Service information
              </h2>

              <p className="text-muted-foreground mt-0.5 text-xs">
                Appointment details
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <InformationField label="Service" value={booking.serviceName} />

            <InformationField
              label="Duration"
              value={`${booking.serviceDurationMinutes} minutes`}
            />

            <InformationField
              label="Price"
              value={formatPrice(booking.priceAmount, booking.currencyCode)}
            />
          </div>
        </section>
      </div>

      <section className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
        <h2 className="text-foreground text-sm font-semibold">
          Booking record
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InformationField
            label="Created"
            value={formatDateTime(booking.createdAt, timeZone)}
          />

          <InformationField
            label="Last updated"
            value={formatDateTime(booking.updatedAt, timeZone)}
          />
        </div>
      </section>
    </div>
  );
}
