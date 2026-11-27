"use client";

import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";

import type {
  BookingDetails,
  BookingDetailsResponse,
  BookingUpdateResponse,
  BookingCustomersResponse,
  BookingDetailsErrorResponse,
  BookingUpdatePayload,
  BookingDetailsCustomer,
} from "@/features/bookings/types";

import {
  getDateInTimeZone,
  getTimeInTimeZone,
  createDateTimeInTimeZone,
} from "@/features/bookings/utils/date";

const editBookingSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  bookingDate: z.iso.date("Select a valid booking date."),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Select a valid start time."),
});

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as BookingDetailsErrorResponse;

    if (payload.error?.issues?.length) {
      return payload.error.issues.map((issue) => issue.message).join(" ");
    }

    return payload.error?.message || fallback;
  } catch {
    return fallback;
  }
}

export function useBookingDetails(bookingId: string) {
  const pendingUpdate = useRef<BookingUpdatePayload | null>(null);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [timeZone, setTimeZone] = useState("");

  const [customers, setCustomers] = useState<BookingDetailsCustomer[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);
  const [canRetryUpdate, setCanRetryUpdate] = useState(false);
  const [canRetryCancel, setCanRetryCancel] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooking() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              "Unable to retrieve booking details.",
            ),
          );
        }

        const result = (await response.json()) as BookingDetailsResponse;

        if (!result.data?.booking || typeof result.data.timeZone !== "string") {
          throw new Error("The server returned an invalid booking response.");
        }

        if (!controller.signal.aborted) {
          setBooking(result.data.booking);
          setTimeZone(result.data.timeZone);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to retrieve booking details.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadBooking();

    return () => {
      controller.abort();
    };
  }, [bookingId, retryKey]);

  const editCustomers = useMemo(() => {
    if (!booking) {
      return customers;
    }

    return customers.some((customer) => customer.id === booking.customer.id)
      ? customers
      : [booking.customer, ...customers];
  }, [booking, customers]);

  async function handleStartEditing() {
    if (!booking || !timeZone) {
      return;
    }

    setErrorMessage(null);
    setCustomerId(booking.customer.id);
    setBookingDate(getDateInTimeZone(booking.startsAt, timeZone));
    setStartTime(getTimeInTimeZone(booking.startsAt, timeZone));

    setIsLoadingCustomers(true);

    try {
      const response = await fetch("/api/customers", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Unable to load customers."),
        );
      }

      const result = (await response.json()) as BookingCustomersResponse;

      if (!result.data || !Array.isArray(result.data.customers)) {
        throw new Error("Invalid customer response.");
      }

      setCustomers(result.data.customers);
      setIsEditing(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load customers.";

      setErrorMessage(message);

      toast.error("Unable to load customers.", {
        description: message,
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  }

  async function sendUpdateRequest(payload: BookingUpdatePayload) {
    setErrorMessage(null);
    setCanRetryUpdate(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to update booking.",
        );

        setErrorMessage(message);

        toast.error("Unable to update booking.", {
          description: message,
        });

        if (isRetryableStatus(response.status)) {
          pendingUpdate.current = payload;
          setCanRetryUpdate(true);
        } else {
          pendingUpdate.current = null;
        }

        return;
      }

      const result = (await response.json()) as BookingUpdateResponse;

      if (!result.data?.booking) {
        throw new Error("The server returned an invalid booking response.");
      }

      pendingUpdate.current = null;
      setCanRetryUpdate(false);
      setBooking(result.data.booking);
      setIsEditing(false);

      toast.success("Booking updated successfully.", {
        description: "Your appointment details have been saved.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update booking.";

      setErrorMessage(message);

      toast.error("Unable to update booking.", {
        description: message,
      });

      pendingUpdate.current = payload;
      setCanRetryUpdate(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!booking || !timeZone) {
      return;
    }

    setErrorMessage(null);
    pendingUpdate.current = null;
    setCanRetryUpdate(false);

    const validation = editBookingSchema.safeParse({
      customerId,
      bookingDate,
      startTime,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    let updatedStart: Date;

    try {
      updatedStart = createDateTimeInTimeZone(
        validation.data.bookingDate,
        validation.data.startTime,
        timeZone,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Please select a valid appointment date and time.",
      );
      return;
    }

    const payload: BookingUpdatePayload = {};

    if (validation.data.customerId !== booking.customer.id) {
      payload.customerId = validation.data.customerId;
    }

    if (updatedStart.toISOString() !== booking.startsAt) {
      payload.startsAt = updatedStart.toISOString();
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    pendingUpdate.current = payload;

    await sendUpdateRequest(payload);
  }

  async function handleRetryUpdate() {
    const payload = pendingUpdate.current;

    if (!payload) {
      return;
    }

    await sendUpdateRequest(payload);
  }

  async function sendCancelRequest() {
    if (!booking || isCancelling) {
      return;
    }

    setErrorMessage(null);
    setCanRetryCancel(false);
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Unable to cancel booking.",
        );

        setErrorMessage(message);

        toast.error("Unable to cancel booking.", {
          description: message,
        });

        setCanRetryCancel(isRetryableStatus(response.status));

        return;
      }

      setBooking((current) =>
        current ? { ...current, status: "CANCELLED" } : current,
      );

      pendingUpdate.current = null;
      setCanRetryUpdate(false);
      setCanRetryCancel(false);

      toast.success("Booking cancelled successfully.", {
        description: "The booking has been marked as cancelled.",
      });
    } catch {
      const message = "Unable to connect to Bookwise. Please try again.";

      setErrorMessage(message);

      toast.error("Connection problem.", {
        description: message,
      });

      setCanRetryCancel(true);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleCancelBooking() {
    if (
      !booking ||
      (booking.status !== "PENDING" && booking.status !== "CONFIRMED")
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    pendingUpdate.current = null;
    setCanRetryUpdate(false);

    await sendCancelRequest();
  }

  function handleRetryCancel() {
    void sendCancelRequest();
  }

  function handleRetryLoad() {
    setErrorMessage(null);
    setIsLoading(true);
    setRetryKey((current) => current + 1);
  }

  function handleCustomerChange(value: string) {
    pendingUpdate.current = null;
    setCanRetryUpdate(false);
    setErrorMessage(null);
    setCustomerId(value);
  }

  function handleBookingDateChange(value: string) {
    pendingUpdate.current = null;
    setCanRetryUpdate(false);
    setErrorMessage(null);
    setBookingDate(value);
  }

  function handleStartTimeChange(value: string) {
    pendingUpdate.current = null;
    setCanRetryUpdate(false);
    setErrorMessage(null);
    setStartTime(value);
  }

  function handleDiscardEditing() {
    pendingUpdate.current = null;
    setCanRetryUpdate(false);
    setIsEditing(false);
    setErrorMessage(null);
  }

  return {
    booking,
    timeZone,
    customers,
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
  };
}
