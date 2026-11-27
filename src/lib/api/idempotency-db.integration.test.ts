import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { withOrganizationTransaction } from "./organization";
import {
  completeIdempotencyRecord,
  reserveIdempotencyKey,
} from "./idempotency-db";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for integration tests.");
}

const parsedDatabaseUrl = new URL(databaseUrl);

if (
  parsedDatabaseUrl.pathname !== "/bookwise_integration_test" ||
  decodeURIComponent(parsedDatabaseUrl.username) !== "bookwise_app"
) {
  throw new Error(
    "Integration tests must use bookwise_integration_test as bookwise_app.",
  );
}

const requestHash = "a".repeat(64);
const differentRequestHash = "b".repeat(64);

const responseBody: Prisma.InputJsonObject = {
  data: {
    bookingId: "integration-test-booking",
  },
};

async function withTestOrganizations<T>(
  count: number,
  callback: (organizationIds: string[]) => Promise<T>,
): Promise<T> {
  const organizationIds: string[] = [];

  try {
    for (let index = 0; index < count; index++) {
      const id = `idempotency-test-${randomUUID()}`;

      await prisma.organization.create({
        data: {
          id,
          name: "Idempotency integration test",
          slug: `idempotency-test-${randomUUID()}`,
          createdAt: new Date(),
        },
      });

      organizationIds.push(id);
    }

    return await callback(organizationIds);
  } finally {
    if (organizationIds.length > 0) {
      await prisma.organization.deleteMany({
        where: {
          id: { in: organizationIds },
        },
      });
    }
  }
}

async function withTestOrganization<T>(
  callback: (organizationId: string) => Promise<T>,
): Promise<T> {
  return withTestOrganizations(1, (ids) => callback(ids[0]));
}

after(async () => {
  await prisma.$disconnect();
});

describe("idempotency database integration", () => {
  it("reserves a new idempotency key", async () => {
    await withTestOrganization(async (organizationId) => {
      const reservation = await withOrganizationTransaction(
        organizationId,
        (tx) =>
          reserveIdempotencyKey({
            tx,
            organizationId,
            key: "reserve-test-key",
            requestHash,
          }),
      );

      assert.deepEqual(reservation, { reserved: true });
    });
  });

  it("persists a response and returns it for a repeated request", async () => {
    await withTestOrganization(async (organizationId) => {
      const replay = await withOrganizationTransaction(
        organizationId,
        async (tx) => {
          const reservation = await reserveIdempotencyKey({
            tx,
            organizationId,
            key: "complete-test-key",
            requestHash,
          });

          assert.deepEqual(reservation, { reserved: true });

          await completeIdempotencyRecord({
            tx,
            organizationId,
            key: "complete-test-key",
            requestHash,
            responseStatus: 201,
            responseBody,
          });

          return reserveIdempotencyKey({
            tx,
            organizationId,
            key: "complete-test-key",
            requestHash,
          });
        },
      );

      assert.deepEqual(replay, {
        reserved: false,
        reason: "EXISTING",
        requestHash,
        responseStatus: 201,
        responseBody,
      });
    });
  });

  it("rejects completion when the request hash does not match", async () => {
    await withTestOrganization(async (organizationId) => {
      await withOrganizationTransaction(organizationId, async (tx) => {
        await reserveIdempotencyKey({
          tx,
          organizationId,
          key: "wrong-hash-test-key",
          requestHash,
        });

        await assert.rejects(
          completeIdempotencyRecord({
            tx,
            organizationId,
            key: "wrong-hash-test-key",
            requestHash: differentRequestHash,
            responseStatus: 201,
            responseBody,
          }),
          /expected exactly one pending record/,
        );
      });
    });
  });

  it("rejects completing an already completed record", async () => {
    await withTestOrganization(async (organizationId) => {
      await withOrganizationTransaction(organizationId, async (tx) => {
        await reserveIdempotencyKey({
          tx,
          organizationId,
          key: "duplicate-completion-test-key",
          requestHash,
        });

        await completeIdempotencyRecord({
          tx,
          organizationId,
          key: "duplicate-completion-test-key",
          requestHash,
          responseStatus: 201,
          responseBody,
        });

        await assert.rejects(
          completeIdempotencyRecord({
            tx,
            organizationId,
            key: "duplicate-completion-test-key",
            requestHash,
            responseStatus: 201,
            responseBody,
          }),
          /expected exactly one pending record/,
        );
      });
    });
  });

  it("rejects an invalid HTTP response status", async () => {
    await withTestOrganization(async (organizationId) => {
      await withOrganizationTransaction(organizationId, async (tx) => {
        await assert.rejects(
          completeIdempotencyRecord({
            tx,
            organizationId,
            key: "invalid-status-test-key",
            requestHash,
            responseStatus: 199,
            responseBody,
          }),
          {
            name: "TypeError",
            message: "Invalid idempotency response status.",
          },
        );
      });
    });
  });

  it("does not expose one organization's records to another organization", async () => {
    await withTestOrganizations(2, async ([organizationA, organizationB]) => {
      await withOrganizationTransaction(organizationA, (tx) =>
        reserveIdempotencyKey({
          tx,
          organizationId: organizationA,
          key: "tenant-isolation-test-key",
          requestHash,
        }),
      );

      const visibleRecords = await withOrganizationTransaction(
        organizationB,
        (tx) =>
          tx.$queryRaw<{ key: string }[]>`
            SELECT key
            FROM public.idempotency_record
            WHERE key = ${"tenant-isolation-test-key"}
          `,
      );

      assert.deepEqual(visibleRecords, []);
    });
  });

  it("rolls back the reservation and response together when the transaction fails", async () => {
    await withTestOrganization(async (organizationId) => {
      await assert.rejects(
        withOrganizationTransaction(organizationId, async (tx) => {
          await reserveIdempotencyKey({
            tx,
            organizationId,
            key: "rollback-test-key",
            requestHash,
          });

          await completeIdempotencyRecord({
            tx,
            organizationId,
            key: "rollback-test-key",
            requestHash,
            responseStatus: 201,
            responseBody,
          });

          throw new Error("Force transaction rollback for integration test.");
        }),
        /Force transaction rollback/,
      );

      const records = await withOrganizationTransaction(
        organizationId,
        (tx) =>
          tx.$queryRaw<{ key: string }[]>`
            SELECT key
            FROM public.idempotency_record
            WHERE key = ${"rollback-test-key"}
          `,
      );

      assert.deepEqual(records, []);
    });
  });
});
