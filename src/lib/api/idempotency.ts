import "server-only";

import { jsonApiError } from "@/lib/api/response";

import { parseIdempotencyKey } from "./idempotency-core";

export { createRequestHash } from "./idempotency-core";

export function parseIdempotencyKeyFromRequest(request: Request) {
  const result = parseIdempotencyKey(request.headers.get("Idempotency-Key"));

  if (!result.valid) {
    return {
      valid: false as const,
      response: jsonApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: result.message,
        issues: result.issues,
      }),
    };
  }

  return result;
}
