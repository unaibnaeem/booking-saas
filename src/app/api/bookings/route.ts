import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import {
  authorizeOrganization,
  withOrganizationTransaction,
} from "@/lib/api/organization";
import {
  jsonApiError,
  jsonApiData,
  jsonValidationError,
  type ApiErrorCode,
} from "@/lib/api/response";
import {
  createRequestHash,
  parseIdempotencyKeyFromRequest,
} from "@/lib/api/idempotency";
import {
  completeIdempotencyRecord,
  reserveIdempotencyKey,
} from "@/lib/api/idempotency-db";
import { getBookingPeriodRange } from "@/features/bookings/utils/timezone";

export const runtime = "nodejs";

// BOOKING VALIDATION

const bookingStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;

const bookingScopes = ["upcoming", "past", "cancelled", "all"] as const;

const bookingPeriods = ["today", "tomorrow", "this-week"] as const;

const createBookingSchema = z
  .object({
    customerId: z.string().trim().min(1).max(255),
    serviceId: z.string().trim().min(1).max(255),
    startsAt: z.iso.datetime({
      offset: true,
    }),
  })
  .strict();

const listBookingsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    scope: z.enum(bookingScopes).default("all"),

    period: z.enum(bookingPeriods).optional(),

    status: z.enum(bookingStatuses).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.from &&
      value.to &&
      new Date(value.from).getTime() >= new Date(value.to).getTime()
    ) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "'to' must be later than 'from'.",
      });
    }
  });

type CreateBookingRequest = z.infer<typeof createBookingSchema>;

type BookingResponse = {
  status: number;
  body: unknown;
};

function createErrorBody(
  code: ApiErrorCode,
  message: string,
): Prisma.InputJsonObject {
  return {
    error: {
      code,
      message,
    },
  };
}

async function saveIdempotentResponse({
  tx,
  organizationId,
  key,
  requestHash,
  status,
  body,
}: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  key: string;
  requestHash: string;
  status: number;
  body: Prisma.InputJsonObject;
}): Promise<BookingResponse> {
  await completeIdempotencyRecord({
    tx,
    organizationId,
    key,
    requestHash,
    responseStatus: status,
    responseBody: body,
  });

  return { status, body };
}

// POST /api/bookings
// CREATE A BOOKING

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;

  const idempotencyResult = parseIdempotencyKeyFromRequest(request);

  if (!idempotencyResult.valid) {
    return idempotencyResult.response;
  }

  const idempotencyKey = idempotencyResult.key;

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

  const validationResult = createBookingSchema.safeParse(rawBody);

  if (!validationResult.success) {
    return jsonValidationError(validationResult.error);
  }

  const input: CreateBookingRequest = validationResult.data;

  const requestHash = createRequestHash({
    method: "POST",
    path: "/api/bookings",
    body: input,
  });

  try {
    const result = await withOrganizationTransaction(
      organizationId,
      async (tx): Promise<BookingResponse> => {
        const reservation = await reserveIdempotencyKey({
          tx,
          organizationId,
          key: idempotencyKey,
          requestHash,
        });

        if (!reservation.reserved) {
          if (reservation.requestHash !== requestHash) {
            return {
              status: 409,
              body: createErrorBody(
                "IDEMPOTENCY_KEY_REUSED",
                "This Idempotency-Key has already been used with a different request.",
              ),
            };
          }

          if (
            reservation.responseStatus === null ||
            reservation.responseBody === null
          ) {
            return {
              status: 409,
              body: createErrorBody(
                "CONFLICT",
                "An incomplete request exists for this idempotency key. Use a new key.",
              ),
            };
          }

          return {
            status: reservation.responseStatus,
            body: reservation.responseBody,
          };
        }

        const [customer, service] = await Promise.all([
          tx.customer.findFirst({
            where: {
              organizationId,
              id: input.customerId,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          }),

          tx.service.findFirst({
            where: {
              organizationId,
              id: input.serviceId,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              priceAmount: true,
              currencyCode: true,
            },
          }),
        ]);

        if (!customer || !service) {
          return saveIdempotentResponse({
            tx,
            organizationId,
            key: idempotencyKey,
            requestHash,
            status: 404,
            body: createErrorBody(
              "NOT_FOUND",
              "The requested customer or service was not found.",
            ),
          });
        }

        if (
          !Number.isSafeInteger(service.durationMinutes) ||
          service.durationMinutes <= 0
        ) {
          throw new Error("The service has an invalid duration.");
        }

        const startsAt = new Date(input.startsAt);

        const endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60_000,
        );

        const booking = await tx.booking.create({
          data: {
            organizationId,
            customerId: customer.id,
            serviceId: service.id,
            status: "PENDING",
            startsAt,
            endsAt,
            serviceName: service.name,
            serviceDurationMinutes: service.durationMinutes,
            priceAmount: service.priceAmount,
            currencyCode: service.currencyCode,
          },
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        const responseBody: Prisma.InputJsonObject = {
          data: {
            booking: {
              id: booking.id,
              status: booking.status,
              startsAt: booking.startsAt.toISOString(),
              endsAt: booking.endsAt.toISOString(),
              createdAt: booking.createdAt.toISOString(),
              updatedAt: booking.updatedAt.toISOString(),
              customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
              },
              service: {
                id: service.id,
                name: service.name,
                durationMinutes: service.durationMinutes,
                priceAmount: service.priceAmount.toString(),
                currencyCode: service.currencyCode,
              },
            },
          },
        };

        return saveIdempotentResponse({
          tx,
          organizationId,
          key: idempotencyKey,
          requestHash,
          status: 201,
          body: responseBody,
        });
      },
    );

    return Response.json(result.body, {
      status: result.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to create booking:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to create the booking.",
    });
  }
}

// GET /api/bookings
// LIST ORGANIZATION BOOKINGS

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;

  const searchParams = new URL(request.url).searchParams;

  const validationResult = listBookingsSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    scope: searchParams.get("scope") ?? undefined,
    period: searchParams.get("period") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!validationResult.success) {
    return jsonValidationError(validationResult.error);
  }

  const { page, limit, scope, period, status, from, to } =
    validationResult.data;

  const now = new Date();

  try {
    const result = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        const settings = await tx.organizationSettings.findUnique({
          where: {
            organizationId,
          },
          select: {
            timeZone: true,
          },
        });

        const timeZone = settings?.timeZone ?? "UTC";

        try {
          new Intl.DateTimeFormat("en-US", {
            timeZone,
          }).format(now);
        } catch {
          throw new Error(
            `Invalid timezone configured for organization: ${timeZone}`,
          );
        }

        const lowerBounds: Date[] = [];
        const upperBounds: Date[] = [];

        if (from) {
          lowerBounds.push(new Date(from));
        }

        if (to) {
          upperBounds.push(new Date(to));
        }

        if (period) {
          const range = getBookingPeriodRange(period, timeZone, now);

          lowerBounds.push(range.from);
          upperBounds.push(range.to);
        }

        const conditions: Prisma.BookingWhereInput[] = [];

        if (status) {
          conditions.push({
            status,
          });
        }

        switch (scope) {
          case "upcoming": {
            conditions.push({
              status: {
                not: "CANCELLED",
              },
            });

            lowerBounds.push(now);
            break;
          }

          case "past": {
            conditions.push({
              status: {
                not: "CANCELLED",
              },
            });

            upperBounds.push(now);
            break;
          }

          case "cancelled": {
            conditions.push({
              status: "CANCELLED",
            });
            break;
          }

          case "all": {
            break;
          }
        }

        const latestLowerBound =
          lowerBounds.length > 0
            ? new Date(Math.max(...lowerBounds.map((date) => date.getTime())))
            : undefined;

        const earliestUpperBound =
          upperBounds.length > 0
            ? new Date(Math.min(...upperBounds.map((date) => date.getTime())))
            : undefined;

        const where: Prisma.BookingWhereInput = {
          organizationId,
        };

        if (conditions.length > 0) {
          where.AND = conditions;
        }

        if (latestLowerBound || earliestUpperBound) {
          where.startsAt = {
            ...(latestLowerBound && {
              gte: latestLowerBound,
            }),

            ...(earliestUpperBound && {
              lt: earliestUpperBound,
            }),
          };
        }

        const orderBy: Prisma.BookingOrderByWithRelationInput[] =
          scope === "upcoming"
            ? [{ startsAt: "asc" }, { id: "asc" }]
            : scope === "cancelled"
              ? [{ updatedAt: "desc" }, { id: "desc" }]
              : [{ startsAt: "desc" }, { id: "desc" }];

        const [bookings, total] = await Promise.all([
          tx.booking.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,

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

          tx.booking.count({
            where,
          }),
        ]);

        return {
          bookings: bookings.map((booking) => ({
            ...booking,
            startsAt: booking.startsAt.toISOString(),
            endsAt: booking.endsAt.toISOString(),
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            priceAmount: booking.priceAmount.toString(),
          })),

          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },

          timeZone,
        };
      },
    );

    return jsonApiData(result);
  } catch (error) {
    console.error("Failed to list bookings:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to retrieve bookings.",
    });
  }
}
