"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useBookingDetails } from "@/features/bookings/hooks/use-booking-details";

import { BookingDetailsHeader } from "@/features/bookings/components/details/booking-details-header";
import { BookingInformation } from "@/features/bookings/components/details/booking-information";
import { BookingEditForm } from "@/features/bookings/components/forms/booking-edit-form";
import { BookingDetailsSkeleton } from "@/features/bookings/components/details/booking-details-skeleton";

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const bookingId = params.id;

  const {
    booking,
    timeZone,
    editCustomers,

    isLoading,
    isLoadingCustomers,
    isEditing,
    isSaving,
    isCancelling,

    customerId,
    bookingDate,
    startTime,

    errorMessage,
    canRetryUpdate,
    canRetryCancel,

    handleStartEditing,
    handleSave,
    handleRetryUpdate,
    handleCancelBooking,
    handleRetryCancel,
    handleRetryLoad,
    handleCustomerChange,
    handleBookingDateChange,
    handleStartTimeChange,
    handleDiscardEditing,
  } = useBookingDetails(bookingId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [bookingId]);

  if (isLoading && !booking) {
    return <BookingDetailsSkeleton />;
  }

  if (!booking) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="border-border bg-surface w-full max-w-md rounded-2xl border p-6 text-center sm:p-8">
          <div className="bg-danger/10 text-danger mx-auto flex size-12 items-center justify-center rounded-xl text-xl font-semibold">
            !
          </div>

          <h1 className="text-foreground mt-5 text-lg font-semibold">
            Unable to load booking
          </h1>

          <p className="text-muted-foreground mt-2 text-sm leading-6 wrap-break-word">
            {errorMessage || "The requested booking could not be found."}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleRetryLoad}
              className="bg-primary text-primary-foreground hover:bg-primary-hover h-11 cursor-pointer rounded-lg px-5 text-sm font-semibold transition-colors"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() => router.push("/bookings")}
              className="border-border bg-surface text-foreground hover:bg-surface-muted h-11 cursor-pointer rounded-lg border px-5 text-sm font-medium transition-colors"
            >
              Back to bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canCancel =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <BookingDetailsHeader
          booking={booking}
          isEditing={isEditing}
          isLoadingCustomers={isLoadingCustomers}
          isCancelling={isCancelling}
          canCancel={canCancel}
          onBack={() => router.push("/bookings")}
          onEdit={() => void handleStartEditing()}
          onCancel={() => void handleCancelBooking()}
        />

        {errorMessage && (
          <div
            role="alert"
            className="border-danger/20 bg-danger/5 text-danger mt-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="min-w-0 text-sm wrap-break-word">{errorMessage}</p>

            <div className="flex shrink-0 flex-wrap gap-2">
              {canRetryUpdate && (
                <button
                  type="button"
                  onClick={() => void handleRetryUpdate()}
                  disabled={isSaving}
                  className="bg-danger/10 hover:bg-danger/15 h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {isSaving ? "Retrying..." : "Retry update"}
                </button>
              )}

              {canRetryCancel && (
                <button
                  type="button"
                  onClick={handleRetryCancel}
                  disabled={isCancelling}
                  className="bg-danger/10 hover:bg-danger/15 h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {isCancelling ? "Retrying..." : "Retry cancellation"}
                </button>
              )}
            </div>
          </div>
        )}

        {isEditing ? (
          <BookingEditForm
            booking={booking}
            customers={editCustomers}
            timeZone={timeZone}
            customerId={customerId}
            bookingDate={bookingDate}
            startTime={startTime}
            isSaving={isSaving}
            onSubmit={handleSave}
            onCustomerChange={handleCustomerChange}
            onBookingDateChange={handleBookingDateChange}
            onStartTimeChange={handleStartTimeChange}
            onDiscard={handleDiscardEditing}
          />
        ) : (
          <BookingInformation booking={booking} timeZone={timeZone} />
        )}
      </div>
    </div>
  );
}
