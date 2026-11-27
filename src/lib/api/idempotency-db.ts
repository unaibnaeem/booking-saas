import "server-only";

import type { Prisma } from "@/generated/prisma/client";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type IdempotencyReservation =
  | { reserved: true }
  | {
      reserved: false;
      reason: "EXISTING";
      requestHash: string;
      responseStatus: number | null;
      responseBody: Prisma.JsonValue | null;
    };

type ReserveIdempotencyKeyOptions = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  key: string;
  requestHash: string;
};

type CompleteIdempotencyRecordOptions = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  key: string;
  requestHash: string;
  responseStatus: number;
  responseBody: Prisma.InputJsonObject;
};

export async function reserveIdempotencyKey({
  tx,
  organizationId,
  key,
  requestHash,
}: ReserveIdempotencyKeyOptions): Promise<IdempotencyReservation> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS);

  const inserted = await tx.$queryRaw<{ organization_id: string }[]>`
    INSERT INTO public.idempotency_record (
      organization_id,
      key,
      request_hash,
      response_status,
      response_body,
      expires_at,
      created_at,
      updated_at
    )
    VALUES (
      ${organizationId},
      ${key},
      ${requestHash},
      NULL,
      NULL,
      ${expiresAt},
      ${now},
      ${now}
    )
    ON CONFLICT (organization_id, key) DO NOTHING
    RETURNING organization_id
  `;

  if (inserted.length > 0) {
    return { reserved: true };
  }

  const existing = await tx.$queryRaw<
    {
      request_hash: string;
      response_status: number | null;
      response_body: Prisma.JsonValue | null;
      expires_at: Date;
    }[]
  >`
    SELECT
      request_hash,
      response_status,
      response_body,
      expires_at
    FROM public.idempotency_record
    WHERE organization_id = ${organizationId}
      AND key = ${key}
    FOR UPDATE
  `;

  if (existing.length === 0) {
    throw new Error("Idempotency record disappeared during reservation.");
  }

  const record = existing[0];

  if (record.expires_at <= now) {
    await tx.$executeRaw`
      UPDATE public.idempotency_record
      SET
        request_hash = ${requestHash},
        response_status = NULL,
        response_body = NULL,
        expires_at = ${expiresAt},
        created_at = ${now},
        updated_at = ${now}
      WHERE organization_id = ${organizationId}
        AND key = ${key}
    `;

    return { reserved: true };
  }

  return {
    reserved: false,
    reason: "EXISTING",
    requestHash: record.request_hash,
    responseStatus: record.response_status,
    responseBody: record.response_body,
  };
}

export async function completeIdempotencyRecord({
  tx,
  organizationId,
  key,
  requestHash,
  responseStatus,
  responseBody,
}: CompleteIdempotencyRecordOptions): Promise<void> {
  if (
    !Number.isInteger(responseStatus) ||
    responseStatus < 200 ||
    responseStatus > 599
  ) {
    throw new TypeError("Invalid idempotency response status.");
  }

  const updated = await tx.$queryRaw<{ organization_id: string }[]>`
    UPDATE public.idempotency_record
    SET
      response_status = ${responseStatus},
      response_body = ${JSON.stringify(responseBody)}::jsonb,
      updated_at = ${new Date()}
    WHERE organization_id = ${organizationId}
      AND key = ${key}
      AND request_hash = ${requestHash}
      AND response_status IS NULL
      AND response_body IS NULL
    RETURNING organization_id
  `;

  if (updated.length !== 1) {
    throw new Error(
      "Unable to complete idempotency record: expected exactly one pending record.",
    );
  }
}
