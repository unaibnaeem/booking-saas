import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createRequestHash, parseIdempotencyKey } from "./idempotency-core";

describe("parseIdempotencyKey", () => {
  it("accepts a valid key", () => {
    const result = parseIdempotencyKey("booking-request-123");

    assert.deepEqual(result, {
      valid: true,
      key: "booking-request-123",
    });
  });

  it("trims surrounding whitespace", () => {
    const result = parseIdempotencyKey("  booking-request-123  ");

    assert.equal(result.valid, true);

    if (result.valid) {
      assert.equal(result.key, "booking-request-123");
    }
  });

  it("rejects a missing key", () => {
    const result = parseIdempotencyKey(null);

    assert.equal(result.valid, false);

    if (!result.valid) {
      assert.equal(result.message, "The Idempotency-Key header is required.");
    }
  });

  it("rejects an empty key", () => {
    const result = parseIdempotencyKey("");

    assert.equal(result.valid, false);
  });

  it("rejects a whitespace-only key", () => {
    const result = parseIdempotencyKey("   ");

    assert.equal(result.valid, false);
  });

  it("rejects keys longer than 255 characters", () => {
    const result = parseIdempotencyKey("a".repeat(256));

    assert.equal(result.valid, false);
  });

  it("accepts a key containing exactly 255 characters", () => {
    const result = parseIdempotencyKey("a".repeat(255));

    assert.equal(result.valid, true);
  });
});

describe("createRequestHash", () => {
  it("generates the same hash regardless of object property order", () => {
    const first = createRequestHash({
      name: "John",
      serviceId: "service-1",
    });

    const second = createRequestHash({
      serviceId: "service-1",
      name: "John",
    });

    assert.equal(first, second);
  });

  it("generates the same hash for nested objects with different property order", () => {
    const first = createRequestHash({
      customer: {
        name: "John",
        email: "john@example.com",
      },
    });

    const second = createRequestHash({
      customer: {
        email: "john@example.com",
        name: "John",
      },
    });

    assert.equal(first, second);
  });

  it("generates different hashes for different payloads", () => {
    const first = createRequestHash({
      serviceId: "service-1",
    });

    const second = createRequestHash({
      serviceId: "service-2",
    });

    assert.notEqual(first, second);
  });

  it("generates a 64-character lowercase SHA-256 hash", () => {
    const hash = createRequestHash({
      serviceId: "service-1",
    });

    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("preserves array order", () => {
    const first = createRequestHash({
      resourceIds: ["resource-1", "resource-2"],
    });

    const second = createRequestHash({
      resourceIds: ["resource-2", "resource-1"],
    });

    assert.notEqual(first, second);
  });

  it("rejects undefined values", () => {
    assert.throws(() => createRequestHash({ value: undefined }), TypeError);
  });

  it("rejects non-finite numbers", () => {
    assert.throws(() => createRequestHash({ value: Number.NaN }), TypeError);

    assert.throws(() => createRequestHash({ value: Infinity }), TypeError);
  });

  it("rejects BigInt values", () => {
    assert.throws(() => createRequestHash({ value: BigInt(123) }), TypeError);
  });

  it("rejects Date objects", () => {
    assert.throws(() => createRequestHash({ date: new Date() }), TypeError);
  });

  it("rejects circular references", () => {
    const payload: Record<string, unknown> = {};
    payload.self = payload;

    assert.throws(() => createRequestHash(payload), TypeError);
  });
});
