import "server-only";

import { z } from "zod";

import {
  authorizeOrganization,
  withOrganizationTransaction,
} from "@/lib/api/organization";

import {
  jsonApiData,
  jsonApiError,
  jsonValidationError,
} from "@/lib/api/response";

export const runtime = "nodejs";

type BookingRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const bookingStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;

const updateBookingSchema = z
  .object({
    customerId: z.string().trim().min(1).max(255).optional(),
    startsAt: z.iso.datetime({ offset: true }).optional(),
    status: z.enum(bookingStatuses).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );

// GET /api/bookings/[id]
// RETRIEVE BOOKING DETAILS

export async function GET(
  request: Request,
  { params }: BookingRouteContext,
): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;
  const { id } = await params;

  try {
    const result = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        const [booking, settings] = await Promise.all([
          tx.booking.findFirst({
            where: {
              id,
              organizationId,
            },
            select: {
              id: true,
              status: true,
              startsAt: true,
              endsAt: true,
              serviceName: true,
              serviceDurationMinutes: true,
              priceAmount: true,
              currencyCode: true,
              createdAt: true,
              updatedAt: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          }),

          tx.organizationSettings.findUnique({
            where: {
              organizationId,
            },
            select: {
              timeZone: true,
            },
          }),
        ]);

        return {
          booking,
          timeZone: settings?.timeZone ?? "UTC",
        };
      },
    );

    if (!result.booking) {
      return jsonApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Booking not found.",
      });
    }

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: result.timeZone,
      }).resolvedOptions();
    } catch {
      throw new Error("Invalid organization timezone configuration.");
    }

    return jsonApiData({
      booking: {
        ...result.booking,
        startsAt: result.booking.startsAt.toISOString(),
        endsAt: result.booking.endsAt.toISOString(),
        createdAt: result.booking.createdAt.toISOString(),
        updatedAt: result.booking.updatedAt.toISOString(),
        priceAmount: result.booking.priceAmount.toString(),
      },
      timeZone: result.timeZone,
    });
  } catch (error) {
    console.error("Failed to retrieve booking:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to retrieve booking.",
    });
  }
}

// PATCH /api/bookings/[id]
// UPDATE A BOOKING

export async function PATCH(
  request: Request,
  { params }: BookingRouteContext,
): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;
  const { id } = await params;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return jsonApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request body must contain valid JSON.",
    });
  }

  const validationResult = updateBookingSchema.safeParse(rawBody);

  if (!validationResult.success) {
    return jsonValidationError(validationResult.error);
  }

  const input = validationResult.data;

  try {
    const booking = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        const existingBooking = await tx.booking.findFirst({
          where: {
            id,
            organizationId,
          },
          select: {
            id: true,
            serviceDurationMinutes: true,
          },
        });

        if (!existingBooking) {
          return null;
        }

        if (input.customerId !== undefined) {
          const customer = await tx.customer.findFirst({
            where: {
              id: input.customerId,
              organizationId,
              isActive: true,
            },
            select: {
              id: true,
            },
          });

          if (!customer) {
            return null;
          }
        }

        const startsAt =
          input.startsAt !== undefined ? new Date(input.startsAt) : undefined;

        const endsAt =
          startsAt !== undefined
            ? new Date(
                startsAt.getTime() +
                  existingBooking.serviceDurationMinutes * 60_000,
              )
            : undefined;

        const updateResult = await tx.booking.updateMany({
          where: {
            id,
            organizationId,
          },
          data: {
            ...(input.customerId !== undefined && {
              customerId: input.customerId,
            }),
            ...(startsAt !== undefined && {
              startsAt,
              endsAt,
            }),
            ...(input.status !== undefined && {
              status: input.status,
            }),
          },
        });

        if (updateResult.count !== 1) {
          return null;
        }

        return tx.booking.findFirst({
          where: {
            id,
            organizationId,
          },
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            serviceName: true,
            serviceDurationMinutes: true,
            priceAmount: true,
            currencyCode: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });
      },
    );

    if (!booking) {
      return jsonApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Booking or requested customer not found.",
      });
    }

    return jsonApiData({
      booking: {
        ...booking,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        priceAmount: booking.priceAmount.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to update booking:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to update booking.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: BookingRouteContext,
): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;
  const { id } = await params;

  try {
    const result = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        const existingBooking = await tx.booking.findFirst({
          where: {
            id,
            organizationId,
          },
          select: {
            status: true,
          },
        });

        if (!existingBooking) {
          return { result: "NOT_FOUND" as const };
        }

        if (existingBooking.status === "CANCELLED") {
          return { result: "CANCELLED" as const };
        }

        if (
          existingBooking.status === "COMPLETED" ||
          existingBooking.status === "NO_SHOW"
        ) {
          return { result: "CONFLICT" as const };
        }

        const updateResult = await tx.booking.updateMany({
          where: {
            id,
            organizationId,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          data: {
            status: "CANCELLED",
          },
        });

        if (updateResult.count === 1) {
          return { result: "CANCELLED" as const };
        }

        const latestBooking = await tx.booking.findFirst({
          where: {
            id,
            organizationId,
          },
          select: {
            status: true,
          },
        });

        if (!latestBooking) {
          return { result: "NOT_FOUND" as const };
        }

        if (latestBooking.status === "CANCELLED") {
          return { result: "CANCELLED" as const };
        }

        return { result: "CONFLICT" as const };
      },
    );

    if (result.result === "NOT_FOUND") {
      return jsonApiError({
        status: 404,
        code: "NOT_FOUND",
        message: "Booking not found.",
      });
    }

    if (result.result === "CONFLICT") {
      return jsonApiError({
        status: 409,
        code: "CONFLICT",
        message: "This booking cannot be cancelled.",
      });
    }

    return jsonApiData({
      booking: {
        id,
        status: "CANCELLED",
      },
    });
  } catch (error) {
    console.error("Failed to cancel booking:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to cancel booking.",
    });
  }
}
