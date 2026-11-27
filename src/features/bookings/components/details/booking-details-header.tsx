import { ButtonSpinner } from "@/components/ui/button-spinner";

import type { BookingDetails } from "@/features/bookings/types";

type BookingDetailsHeaderProps = {
  booking: BookingDetails;
  isEditing: boolean;
  isLoadingCustomers: boolean;
  isCancelling: boolean;
  canCancel: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

export function BookingDetailsHeader({
  booking,
  isEditing,
  isLoadingCustomers,
  isCancelling,
  canCancel,
  onBack,
  onEdit,
  onCancel,
}: BookingDetailsHeaderProps) {
  return (
    <header>
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-primary inline-flex h-9 cursor-pointer items-center gap-2 text-sm font-medium transition-colors"
      >
        <span aria-hidden="true">←</span>
        Back to bookings
      </button>

      <div className="mt-5 flex flex-col gap-5 sm:mt-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-accent text-xs font-semibold tracking-wider uppercase">
            Booking details
          </p>

          <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl lg:text-4xl">
            {booking.customer.name}
          </h1>

          <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
            Booking reference
            <span className="text-foreground ml-2 font-mono text-xs break-all">
              {booking.id}
            </span>
          </p>
        </div>

        {!isEditing && (
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button
              type="button"
              onClick={onEdit}
              disabled={isLoadingCustomers || isCancelling}
              className="border-border bg-surface text-foreground hover:bg-surface-muted h-11 w-full cursor-pointer rounded-lg border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoadingCustomers ? (
                <ButtonSpinner label="Loading..." />
              ) : (
                "Edit booking"
              )}
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelling || isLoadingCustomers}
                className="border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 h-11 w-full cursor-pointer rounded-lg border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isCancelling ? (
                  <ButtonSpinner label="Cancelling..." />
                ) : (
                  "Cancel booking"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
