import type { SubmitEvent } from "react";

import type {
  BookingDetails,
  BookingDetailsCustomer,
} from "@/features/bookings/types";

import { formatPrice } from "@/features/bookings/utils/format";
import { SelectChevron } from "@/components/ui/select-chevron";
import { ButtonSpinner } from "@/components/ui/button-spinner";

type BookingEditFormProps = {
  booking: BookingDetails;
  customers: BookingDetailsCustomer[];
  timeZone: string;

  customerId: string;
  bookingDate: string;
  startTime: string;

  isSaving: boolean;

  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onCustomerChange: (value: string) => void;
  onBookingDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onDiscard: () => void;
};

export function BookingEditForm({
  booking,
  customers,
  timeZone,
  customerId,
  bookingDate,
  startTime,
  isSaving,
  onSubmit,
  onCustomerChange,
  onBookingDateChange,
  onStartTimeChange,
  onDiscard,
}: BookingEditFormProps) {
  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="border-border bg-surface mt-6 space-y-6 rounded-2xl border p-5 sm:mt-7 sm:p-8"
    >
      <div className="border-border border-b pb-5">
        <h2 className="text-foreground text-lg font-semibold">Edit booking</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Update the customer or appointment schedule.
        </p>

        <p className="text-muted-foreground mt-3 text-xs">
          Appointment times use{" "}
          <span className="text-foreground font-medium">{timeZone}</span>.
        </p>
      </div>

      <div>
        <label
          htmlFor="edit-customer"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          Customer
        </label>

        <div className="relative">
          <select
            id="edit-customer"
            required
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
            disabled={isSaving}
            className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full appearance-none rounded-lg border py-2 pr-10 pl-3 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.email ? ` · ${customer.email}` : ""}
              </option>
            ))}
          </select>

          <SelectChevron className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </div>
      </div>

      <div className="border-border space-y-4 border-t pt-5">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            Appointment schedule
          </h3>

          <p className="text-muted-foreground mt-1 text-xs">
            Choose the new appointment date and start time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="edit-date"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Booking date
            </label>

            <input
              id="edit-date"
              type="date"
              required
              value={bookingDate}
              onChange={(event) => onBookingDateChange(event.target.value)}
              disabled={isSaving}
              className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full min-w-0 rounded-lg border px-3 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="edit-time"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Start time
            </label>

            <input
              id="edit-time"
              type="time"
              required
              value={startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
              disabled={isSaving}
              className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full min-w-0 rounded-lg border px-3 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <div className="border-border border-t pt-5">
        <div className="bg-surface-muted border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">
            Service details
          </p>

          <p className="text-foreground mt-2 text-sm font-semibold">
            {booking.serviceName}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-muted-foreground text-xs">
              {booking.serviceDurationMinutes} minutes
            </span>

            <span className="text-muted-foreground text-xs">
              {formatPrice(booking.priceAmount, booking.currencyCode)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="border-border bg-surface text-foreground hover:bg-surface-muted h-11 w-full cursor-pointer rounded-lg border px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Discard changes
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 w-full cursor-pointer rounded-lg px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSaving ? (
            <ButtonSpinner label="Saving changes..." />
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}
