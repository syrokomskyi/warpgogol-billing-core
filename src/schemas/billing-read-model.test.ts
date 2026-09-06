// @vitest-environment node

import { describe, expect, it } from "vitest";

import { billingReadModelSchema } from "./billing-read-model.ts";
import { invoiceV1Schema } from "./invoice.ts";

const validInvoice = invoiceV1Schema.parse({
  invoiceId: "inv-001",
  kind: "activation",
  number: "2026-001",
  amount: 500,
  currency: "EUR",
  status: "issued",
  issuedAt: "2026-01-01T00:00:00.000Z",
  dueAt: null,
  paidAt: null,
  pdfRef: "invoices/2026-001.pdf",
});

describe("billingReadModelSchema", () => {
  it("parses a valid read model", () => {
    const result = billingReadModelSchema.safeParse({
      schema: "warpgogol.billing-read-model@1",
      revision: 1,
      invoices: [validInvoice],
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong schema literal", () => {
    expect(
      billingReadModelSchema.safeParse({
        schema: "wrong",
        revision: 1,
        invoices: [],
        observedAt: "2026-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects negative revision", () => {
    expect(
      billingReadModelSchema.safeParse({
        schema: "warpgogol.billing-read-model@1",
        revision: -1,
        invoices: [],
        observedAt: "2026-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
