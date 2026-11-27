"use client";

import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import type {
  BookingCustomersResponse,
  BookingListResponse,
  BookingServicesResponse,
  BookingCustomerOption,
  BookingServiceOption,
  CreateBookingPayload,
} from "@/features/bookings/types";

import { createDateTimeInTimeZone } from "@/features/bookings/utils/date";

type IdempotencyAttempt = {
  key: string;
  fingerprint: string;
  payload: CreateBookingPayload;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    issues?: {
      path: (string | number)[];
      message: string;
    }[];
  };
};

const bookingFormSchema = z
  .object({
    customerId: z.string().min(1, "Please select a customer."),
    serviceId: z.string().min(1, "Please select a service."),
    bookingDate: z.iso.date("Please select a valid booking date."),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please select a valid start time."),
  })
  .strict();

function getApiError(payload: unknown, fallback: string): string {
  const result = payload as ApiErrorResponse;
  const issues = result.error?.issues;

  if (issues?.length) {
    return issues
      .map((issue) => {
        const field = issue.path.join(".");
        return field ? `${field}: ${issue.message}` : issue.message;
      })
      .join(" ");
  }

  return result.error?.message || fallback;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function formatPrice(amount: string, currency: string): string {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${amount} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function useCreateBooking() {
  const router = useRouter();

  const [customers, setCustomers] = useState<BookingCustomerOption[]>([]);
  const [services, setServices] = useState<BookingServiceOption[]>([]);
  const [timeZone, setTimeZone] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  const idempotencyAttempt = useRef<IdempotencyAttempt | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [services, serviceId],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      try {
        const [customersResponse, servicesResponse, bookingsResponse] =
          await Promise.all([
            fetch("/api/customers", {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/services", {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/bookings?page=1&limit=1", {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }),
          ]);

        const [customersPayload, servicesPayload, bookingsPayload] =
          await Promise.all([
            customersResponse.json(),
            servicesResponse.json(),
            bookingsResponse.json(),
          ]);

        if (!customersResponse.ok) {
          throw new Error(
            getApiError(customersPayload, "Unable to load customers."),
          );
        }

        if (!servicesResponse.ok) {
          throw new Error(
            getApiError(servicesPayload, "Unable to load services."),
          );
        }

        if (!bookingsResponse.ok) {
          throw new Error(
            getApiError(
              bookingsPayload,
              "Unable to load organization settings.",
            ),
          );
        }

        const customerResult = customersPayload as BookingCustomersResponse;
        const serviceResult = servicesPayload as BookingServicesResponse;
        const bookingsResult = bookingsPayload as BookingListResponse;

        if (
          !customerResult.data ||
          !Array.isArray(customerResult.data.customers) ||
          !serviceResult.data ||
          !Array.isArray(serviceResult.data.services) ||
          !bookingsResult.data ||
          !bookingsResult.data.pagination ||
          typeof bookingsResult.data.timeZone !== "string"
        ) {
          throw new Error(
            "The server returned invalid customer, service, or organization data.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setCustomers(customerResult.data.customers);
        setServices(serviceResult.data.services);
        setTimeZone(bookingsResult.data.timeZone);
        setLoadingError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadingError(
            error instanceof Error
              ? error.message
              : "Unable to load booking options.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      controller.abort();
    };
  }, [retryKey]);

  function handleRetryLoading() {
    setLoadingError(null);
    setIsLoadingOptions(true);
    setRetryKey((current) => current + 1);
  }

  function clearRetryState() {
    idempotencyAttempt.current = null;
    setCanRetry(false);
    setErrorMessage(null);
  }

  async function sendBookingRequest(attempt: IdempotencyAttempt) {
    setIsSubmitting(true);
    setErrorMessage(null);
    setCanRetry(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attempt.key,
        },
        body: JSON.stringify(attempt.payload),
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);

        const message = getApiError(
          payload,
          "Unable to create the booking. Please try again.",
        );

        setErrorMessage(message);

        toast.error("Unable to create booking.", {
          description: message,
        });

        const retryable = isRetryableStatus(response.status);

        setCanRetry(retryable);

        if (!retryable) {
          idempotencyAttempt.current = null;
        }

        return;
      }

      idempotencyAttempt.current = null;

      toast.success("Booking created successfully.", {
        description: "Your new appointment has been added to the schedule.",
      });

      router.replace("/bookings");
      router.refresh();
    } catch {
      const message = "Unable to connect to Bookwise. Please try again.";

      setErrorMessage(message);

      toast.error("Connection problem.", {
        description: message,
      });

      setCanRetry(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setCanRetry(false);

    const validation = bookingFormSchema.safeParse({
      customerId,
      serviceId,
      bookingDate,
      startTime,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    if (!timeZone) {
      setErrorMessage("Organization timezone is not available.");
      return;
    }

    let startsAt: Date;

    try {
      startsAt = createDateTimeInTimeZone(
        validation.data.bookingDate,
        validation.data.startTime,
        timeZone,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Please select a valid booking date and time.",
      );
      return;
    }

    const payload: CreateBookingPayload = {
      customerId: validation.data.customerId,
      serviceId: validation.data.serviceId,
      startsAt: startsAt.toISOString(),
    };

    const fingerprint = JSON.stringify(payload);
    const existingAttempt = idempotencyAttempt.current;

    const attempt =
      existingAttempt?.fingerprint === fingerprint
        ? existingAttempt
        : {
            key: crypto.randomUUID(),
            fingerprint,
            payload,
          };

    idempotencyAttempt.current = attempt;

    await sendBookingRequest(attempt);
  }

  function handleRetryRequest() {
    const attempt = idempotencyAttempt.current;

    if (attempt) {
      void sendBookingRequest(attempt);
    }
  }

  function handleCustomerChange(value: string) {
    setCustomerId(value);
    clearRetryState();
  }

  function handleServiceChange(value: string) {
    setServiceId(value);
    clearRetryState();
  }

  function handleBookingDateChange(value: string) {
    setBookingDate(value);
    clearRetryState();
  }

  function handleStartTimeChange(value: string) {
    setStartTime(value);
    clearRetryState();
  }

  return {
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
  };
}
