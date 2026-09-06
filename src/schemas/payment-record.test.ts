// @vitest-environment node

import { describe, expect, it } from "vitest";

import { paymentRecordV1Schema } from "./payment-record.ts";

const validPayment = {
  paymentId: "pay-001",
  invoiceId: "inv-001",
  amount: 500,
  currency: "EUR",
  recordedAt: "2026-01-15T00:00:00.000Z",
  recordedBy: "operator-1",
};

describe("paymentRecordV1Schema", () => {
  it("parses a valid payment record", () => {
    expect(paymentRecordV1Schema.safeParse(validPayment).success).toBe(true);
  });

  it("accepts unknown keys (non-strict schema)", () => {
    expect(paymentRecordV1Schema.safeParse({ ...validPayment, extra: true }).success).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(paymentRecordV1Schema.safeParse({ ...validPayment, amount: -1 }).success).toBe(false);
  });

  it("rejects invalid currency format", () => {
    expect(paymentRecordV1Schema.safeParse({ ...validPayment, currency: "usd" }).success).toBe(
      false,
    );
  });
});
