import type { SubmitEvent } from "react";
import Link from "next/link";

import { SelectChevron } from "@/components/ui/select-chevron";
import { ButtonSpinner } from "@/components/ui/button-spinner";

import type {
  BookingCustomerOption,
  BookingServiceOption,
} from "@/features/bookings/types";

type NewBookingFormProps = {
  customers: BookingCustomerOption[];
  services: BookingServiceOption[];
  selectedService: BookingServiceOption | undefined;

  timeZone: string;

  customerId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;

  isSubmitting: boolean;
  errorMessage: string | null;
  canRetry: boolean;

  formatPrice: (amount: string, currency: string) => string;

  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onCustomerChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onBookingDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onRetry: () => void;
};

export function NewBookingForm({
  customers,
  services,
  selectedService,
  timeZone,
  customerId,
  serviceId,
  bookingDate,
  startTime,
  isSubmitting,
  errorMessage,
  canRetry,
  formatPrice,
  onSubmit,
  onCustomerChange,
  onServiceChange,
  onBookingDateChange,
  onStartTimeChange,
  onRetry,
}: NewBookingFormProps) {
  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="border-border bg-surface mt-7 overflow-hidden rounded-2xl border"
    >
      <div className="border-border border-b px-5 py-5 sm:px-7 sm:py-6">
        <h2 className="text-foreground text-lg font-semibold">
          Appointment information
        </h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Fill in the details to schedule your appointment.
        </p>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <section>
          <div className="mb-4">
            <h3 className="text-foreground text-sm font-semibold">Customer</h3>

            <p className="text-muted-foreground mt-1 text-xs">
              Select the customer for this appointment.
            </p>
          </div>

          <label
            htmlFor="customer"
            className="text-foreground mb-2 block text-sm font-medium"
          >
            Customer
          </label>

          <div className="relative">
            <select
              id="customer"
              value={customerId}
              onChange={(event) => onCustomerChange(event.target.value)}
              required
              disabled={isSubmitting}
              className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full appearance-none rounded-lg border py-2 pr-10 pl-3 text-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select a customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.email ? ` · ${customer.email}` : ""}
                </option>
              ))}
            </select>

            <SelectChevron className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
        </section>

        <section className="border-border border-t pt-7">
          <div className="mb-4">
            <h3 className="text-foreground text-sm font-semibold">Service</h3>

            <p className="text-muted-foreground mt-1 text-xs">
              Choose the service the customer wants to book.
            </p>
          </div>

          <label
            htmlFor="service"
            className="text-foreground mb-2 block text-sm font-medium"
          >
            Select service
          </label>

          <div className="relative">
            <select
              id="service"
              value={serviceId}
              onChange={(event) => onServiceChange(event.target.value)}
              required
              disabled={isSubmitting}
              className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full appearance-none rounded-lg border py-2 pr-10 pl-3 text-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select a service</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <SelectChevron className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>

          {selectedService && (
            <div className="border-border bg-surface-muted mt-4 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-medium">
                  Service duration
                </p>

                <p className="text-foreground mt-2 text-sm font-semibold">
                  {selectedService.durationMinutes} minutes
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-medium">
                  Service price
                </p>

                <p className="text-primary mt-2 text-base font-bold wrap-break-word">
                  {formatPrice(
                    selectedService.priceAmount,
                    selectedService.currencyCode,
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="border-border border-t pt-7">
          <div className="mb-4">
            <h3 className="text-foreground text-sm font-semibold">
              Appointment schedule
            </h3>

            <p className="text-muted-foreground mt-1 text-xs">
              Select when the appointment should begin.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="booking-date"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Booking date
              </label>

              <input
                id="booking-date"
                type="date"
                value={bookingDate}
                onChange={(event) => onBookingDateChange(event.target.value)}
                required
                disabled={isSubmitting}
                className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full min-w-0 rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="start-time"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Start time
              </label>

              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(event) => onStartTimeChange(event.target.value)}
                required
                disabled={isSubmitting}
                className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary/10 h-11 w-full min-w-0 rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="border-border bg-surface-muted mt-4 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs leading-5">
              Appointment date and time are interpreted using your
              organization&apos;s timezone:{" "}
              <span className="text-foreground font-semibold">{timeZone}</span>.
            </p>
          </div>
        </section>

        {errorMessage && (
          <div
            role="alert"
            className="border-danger/20 bg-danger/5 text-danger rounded-xl border p-4"
          >
            <p className="text-sm leading-6 wrap-break-word">{errorMessage}</p>

            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isSubmitting}
                className="bg-danger/10 hover:bg-danger/15 mt-3 h-9 cursor-pointer rounded-lg px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <ButtonSpinner label="Retrying..." />
                ) : (
                  "Retry same request"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-border bg-surface-muted/40 flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-end sm:px-7 sm:py-5">
        <Link
          href="/bookings"
          className="border-border bg-surface text-foreground hover:bg-surface-muted flex h-11 w-full items-center justify-center rounded-lg border px-5 text-sm font-medium transition-colors sm:w-auto"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 w-full cursor-pointer rounded-lg px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? (
            <ButtonSpinner label="Creating booking..." />
          ) : (
            "Create booking"
          )}
        </button>
      </div>
    </form>
  );
}
