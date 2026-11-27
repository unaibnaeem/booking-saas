import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

export const apiErrorCodeSchema = z.enum([
  "UNAUTHENTICATED",
  "ORGANIZATION_REQUIRED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "CONFLICT",
  "IDEMPOTENCY_KEY_REUSED",
  "INTERNAL_ERROR",
]);

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    issues: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
          code: z.string(),
        }),
      )
      .optional(),
  }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

type ApiErrorOptions = {
  status: number;
  code: ApiErrorCode;
  message: string;
  issues?: readonly z.ZodIssue[];
};

export function jsonApiError({
  status,
  code,
  message,
  issues,
}: ApiErrorOptions) {
  const body = apiErrorResponseSchema.parse({
    error: {
      code,
      message,
      ...(issues && {
        issues: issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      }),
    },
  });

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function jsonValidationError(error: z.ZodError) {
  return jsonApiError({
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Request validation failed.",
    issues: error.issues,
  });
}

export function jsonApiData<T>(data: T, status = 200) {
  return NextResponse.json(
    { data },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
