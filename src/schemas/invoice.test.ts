// @vitest-environment node

import { describe, expect, it } from "vitest";

import { invoiceV1Schema, invoiceKindSchema, invoiceStatusSchema } from "./invoice.ts";

const validInvoice = {
  invoiceId: "inv-001",
  kind: "activation",
  number: "2026-001",
  amount: 500,
  currency: "EUR",
  status: "issued",
  issuedAt: "2026-01-01T00:00:00.000Z",
  dueAt: "2026-02-01T00:00:00.000Z",
  paidAt: null,
  pdfRef: "invoices/2026-001.pdf",
};

describe("invoiceV1Schema", () => {
  it("parses a valid invoice", () => {
    expect(invoiceV1Schema.safeParse(validInvoice).success).toBe(true);
  });

  it("accepts unknown keys (non-strict schema)", () => {
    expect(invoiceV1Schema.safeParse({ ...validInvoice, extra: true }).success).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(invoiceV1Schema.safeParse({ ...validInvoice, amount: -1 }).success).toBe(false);
  });

  it("rejects invalid currency format", () => {
    expect(invoiceV1Schema.safeParse({ ...validInvoice, currency: "eur" }).success).toBe(false);
  });

  it("rejects invalid kind", () => {
    expect(invoiceV1Schema.safeParse({ ...validInvoice, kind: "unknown" }).success).toBe(false);
  });
});

describe("invoiceKindSchema", () => {
  it("accepts activation, subscription, other", () => {
    expect(invoiceKindSchema.safeParse("activation").success).toBe(true);
    expect(invoiceKindSchema.safeParse("subscription").success).toBe(true);
    expect(invoiceKindSchema.safeParse("other").success).toBe(true);
  });
});

describe("invoiceStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const status of ["issued", "due", "paid", "overdue", "cancelled", "corrected"]) {
      expect(invoiceStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});
