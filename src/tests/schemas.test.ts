import { describe, it, expect } from "vitest";
import {
  invoiceV1Schema,
  paymentRecordV1Schema,
  billingReadModelSchema,
} from "../schemas/index.ts";

describe("invoiceV1Schema", () => {
  it("accepts a valid invoice", () => {
    const valid = {
      invoiceId: "inv-001",
      kind: "activation",
      number: "2026-001",
      amount: 1000,
      currency: "EUR",
      status: "issued",
      issuedAt: "2026-01-01T00:00:00Z",
      dueAt: "2026-02-01T00:00:00Z",
      paidAt: null,
      pdfRef: "r2://invoices/inv-001.pdf",
    };
    expect(invoiceV1Schema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid currency", () => {
    const invalid = {
      invoiceId: "inv-001",
      kind: "activation",
      number: "2026-001",
      amount: 1000,
      currency: "eur",
      status: "issued",
      issuedAt: null,
      dueAt: null,
      paidAt: null,
      pdfRef: "r2://invoices/inv-001.pdf",
    };
    expect(() => invoiceV1Schema.parse(invalid)).toThrow();
  });

  it("rejects negative amount", () => {
    const invalid = {
      invoiceId: "inv-001",
      kind: "activation",
      number: "2026-001",
      amount: -1,
      currency: "EUR",
      status: "issued",
      issuedAt: null,
      dueAt: null,
      paidAt: null,
      pdfRef: "r2://invoices/inv-001.pdf",
    };
    expect(() => invoiceV1Schema.parse(invalid)).toThrow();
  });

  it("rejects empty pdfRef", () => {
    const invalid = {
      invoiceId: "inv-001",
      kind: "activation",
      number: "2026-001",
      amount: 100,
      currency: "EUR",
      status: "issued",
      issuedAt: null,
      dueAt: null,
      paidAt: null,
      pdfRef: "",
    };
    expect(() => invoiceV1Schema.parse(invalid)).toThrow();
  });

  it("rejects invalid kind", () => {
    const invalid = {
      invoiceId: "inv-001",
      kind: "unknown",
      number: "2026-001",
      amount: 100,
      currency: "EUR",
      status: "issued",
      issuedAt: null,
      dueAt: null,
      paidAt: null,
      pdfRef: "r2://invoices/inv-001.pdf",
    };
    expect(() => invoiceV1Schema.parse(invalid)).toThrow();
  });

  it("rejects invalid status", () => {
    const invalid = {
      invoiceId: "inv-001",
      kind: "activation",
      number: "2026-001",
      amount: 100,
      currency: "EUR",
      status: "unknown",
      issuedAt: null,
      dueAt: null,
      paidAt: null,
      pdfRef: "r2://invoices/inv-001.pdf",
    };
    expect(() => invoiceV1Schema.parse(invalid)).toThrow();
  });
});

describe("paymentRecordV1Schema", () => {
  it("accepts a valid payment record", () => {
    const valid = {
      paymentId: "pay-001",
      invoiceId: "inv-001",
      amount: 500,
      currency: "EUR",
      recordedAt: "2026-01-15T10:00:00Z",
      recordedBy: "operator@example.com",
    };
    expect(paymentRecordV1Schema.parse(valid)).toEqual(valid);
  });

  it("rejects negative amount", () => {
    const invalid = {
      paymentId: "pay-001",
      invoiceId: "inv-001",
      amount: -10,
      currency: "EUR",
      recordedAt: "2026-01-15T10:00:00Z",
      recordedBy: "operator@example.com",
    };
    expect(() => paymentRecordV1Schema.parse(invalid)).toThrow();
  });
});

describe("billingReadModelSchema", () => {
  it("accepts a valid read model", () => {
    const valid = {
      schema: "warpgogol.billing-read-model@1",
      revision: 3,
      invoices: [],
      observedAt: "2026-01-01T00:00:00Z",
    };
    expect(billingReadModelSchema.parse(valid)).toEqual(valid);
  });

  it("rejects wrong schema literal", () => {
    const invalid = {
      schema: "warpgogol.billing-read-model@2",
      revision: 3,
      invoices: [],
      observedAt: "2026-01-01T00:00:00Z",
    };
    expect(() => billingReadModelSchema.parse(invalid)).toThrow();
  });

  it("rejects negative revision", () => {
    const invalid = {
      schema: "warpgogol.billing-read-model@1",
      revision: -1,
      invoices: [],
      observedAt: "2026-01-01T00:00:00Z",
    };
    expect(() => billingReadModelSchema.parse(invalid)).toThrow();
  });
});
