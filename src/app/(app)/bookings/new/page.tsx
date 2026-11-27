"use client";

import { useCreateBooking } from "@/features/bookings/hooks/use-create-booking";

import { NewBookingPageHeader } from "@/features/bookings/components/new-booking/new-booking-page-header";
import { NewBookingOptionsState } from "@/features/bookings/components/forms/new-booking-options-state";
import { NewBookingForm } from "@/features/bookings/components/forms/new-booking-form";

export default function CreateBookingPage() {
  const {
    customers,
    services,
    timeZone,
    selectedService,

    customerId,
    serviceId,
    bookingDate,
    startTime,

    isLoadingOptions,
    isSubmitting,
    loadingError,
    errorMessage,
    canRetry,

    formatPrice,

    handleRetryLoading,
    handleSubmit,
    handleRetryRequest,
    handleCustomerChange,
    handleServiceChange,
    handleBookingDateChange,
    handleStartTimeChange,
  } = useCreateBooking();

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <NewBookingPageHeader />

        <NewBookingOptionsState
          isLoading={isLoadingOptions}
          loadingError={loadingError}
          customersCount={customers.length}
          servicesCount={services.length}
          onRetry={handleRetryLoading}
        />

        {!isLoadingOptions &&
          !loadingError &&
          customers.length > 0 &&
          services.length > 0 && (
            <NewBookingForm
              customers={customers}
              services={services}
              selectedService={selectedService}
              timeZone={timeZone}
              customerId={customerId}
              serviceId={serviceId}
              bookingDate={bookingDate}
              startTime={startTime}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              canRetry={canRetry}
              formatPrice={formatPrice}
              onSubmit={handleSubmit}
              onCustomerChange={handleCustomerChange}
              onServiceChange={handleServiceChange}
              onBookingDateChange={handleBookingDateChange}
              onStartTimeChange={handleStartTimeChange}
              onRetry={handleRetryRequest}
            />
          )}
      </div>
    </div>
  );
}
