import Link from "next/link";

import { NewBookingSkeleton } from "../new-booking/new-booking-skeleton";

type NewBookingOptionsStateProps = {
  isLoading: boolean;
  loadingError: string | null;
  customersCount: number;
  servicesCount: number;
  onRetry: () => void;
};

export function NewBookingOptionsState({
  isLoading,
  loadingError,
  customersCount,
  servicesCount,
  onRetry,
}: NewBookingOptionsStateProps) {
  if (isLoading) {
    return <NewBookingSkeleton />;
  }

  if (loadingError) {
    return (
      <div className="border-danger/20 bg-danger/5 mt-7 rounded-2xl border p-6 text-center sm:p-8">
        <div className="bg-danger/10 text-danger mx-auto flex size-12 items-center justify-center rounded-xl text-lg font-semibold">
          !
        </div>

        <h2 className="text-foreground mt-5 text-base font-semibold">
          Unable to load booking options
        </h2>

        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6 wrap-break-word">
          {loadingError}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-primary-foreground hover:bg-primary-hover mt-5 h-11 cursor-pointer rounded-lg px-6 text-sm font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (customersCount === 0 || servicesCount === 0) {
    const bothUnavailable = customersCount === 0 && servicesCount === 0;

    return (
      <div className="border-border bg-surface mt-7 rounded-2xl border p-6 sm:p-8">
        <div className="bg-accent-soft text-primary flex size-12 items-center justify-center rounded-xl text-lg font-semibold">
          !
        </div>

        <h2 className="text-foreground mt-5 text-base font-semibold">
          Booking options unavailable
        </h2>

        <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-6">
          {bothUnavailable
            ? "Your organization needs at least one active customer and one active service before you can create a booking."
            : customersCount === 0
              ? "Your organization does not have any active customers yet. Add a customer before creating a booking."
              : "Your organization does not have any active services yet. Add a service before creating a booking."}
        </p>

        <Link
          href="/bookings"
          className="border-border bg-surface text-foreground hover:bg-surface-muted mt-5 inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium transition-colors"
        >
          Back to bookings
        </Link>
      </div>
    );
  }

  return null;
}
