import { createHash } from "node:crypto";
import { z } from "zod";

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(1, "Idempotency-Key cannot be empty.")
  .max(255, "Idempotency-Key cannot exceed 255 characters.");

export type IdempotencyKeyResult =
  | { valid: true; key: string }
  | {
      valid: false;
      message: string;
      issues: z.ZodIssue[];
    };

export function parseIdempotencyKey(
  headerValue: string | null,
): IdempotencyKeyResult {
  const result = idempotencyKeySchema.safeParse(headerValue);

  if (!result.success) {
    return {
      valid: false,
      message:
        headerValue === null
          ? "The Idempotency-Key header is required."
          : "The Idempotency-Key header is invalid.",
      issues: result.error.issues,
    };
  }

  return {
    valid: true,
    key: result.data,
  };
}

function stableSerialize(
  value: unknown,
  ancestors = new Set<object>(),
): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Request payload contains a non-finite number.");
    }

    return JSON.stringify(value);
  }

  if (typeof value !== "object") {
    throw new TypeError("Request payload contains an unsupported value.");
  }

  if (ancestors.has(value)) {
    throw new TypeError("Request payload contains a circular reference.");
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      if (Reflect.ownKeys(value).length !== value.length + 1) {
        throw new TypeError("Request payload contains an invalid array.");
      }

      const items = value.map((item, index) => {
        if (!Object.hasOwn(value, index)) {
          throw new TypeError("Request payload contains a sparse array.");
        }

        return stableSerialize(item, ancestors);
      });

      return `[${items.join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Request payload must contain plain objects.");
    }

    const keys = Reflect.ownKeys(value);

    if (keys.some((key) => typeof key !== "string")) {
      throw new TypeError("Request payload contains symbol keys.");
    }

    const record = value as Record<string, unknown>;

    const entries = (keys as string[]).sort().map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(record, key);

      if (
        !descriptor ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, "value")
      ) {
        throw new TypeError(
          "Request payload contains an unsupported object property.",
        );
      }

      return `${JSON.stringify(key)}:${stableSerialize(
        descriptor.value,
        ancestors,
      )}`;
    });

    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function createRequestHash(payload: unknown): string {
  const serialized = stableSerialize(payload);

  return createHash("sha256").update(serialized, "utf8").digest("hex");
}
