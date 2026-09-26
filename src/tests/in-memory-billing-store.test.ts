import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryBillingStore } from "../in-memory-billing-store.ts";
import type { InvoiceV1 } from "../schemas/index.ts";

const PROJECT_ID = "proj-001";
const VALID_INVOICE: Omit<InvoiceV1, "invoiceId"> = {
  kind: "activation",
  number: "2026-001",
  amount: 1000,
  currency: "EUR",
  status: "due",
  issuedAt: "2026-01-01T00:00:00Z",
  dueAt: "2026-02-01T00:00:00Z",
  paidAt: null,
  pdfRef: "r2://invoices/001.pdf",
};

describe("InMemoryBillingStore", () => {
  let store: InMemoryBillingStore;

  beforeEach(() => {
    store = new InMemoryBillingStore();
  });

  describe("getRevision", () => {
    it("returns 0 for unknown project", async () => {
      expect(await store.getRevision(PROJECT_ID)).toBe(0);
    });

    it("returns incremented revision after upsertInvoice", async () => {
      await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      expect(await store.getRevision(PROJECT_ID)).toBe(1);
      await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      expect(await store.getRevision(PROJECT_ID)).toBe(2);
    });

    it("returns incremented revision after recordPayment", async () => {
      await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      await store.recordPayment(PROJECT_ID, "inv-1", {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      expect(await store.getRevision(PROJECT_ID)).toBe(2);
    });
  });

  describe("getBillingReadModel", () => {
    it("returns empty invoices for unknown project with revision 0", async () => {
      const model = await store.getBillingReadModel(PROJECT_ID);
      expect(model).not.toBeNull();
      expect(model!.revision).toBe(0);
      expect(model!.invoices).toEqual([]);
      expect(model!.schema).toBe("warpgogol.billing-read-model@1");
    });

    it("returns invoices after upsert", async () => {
      await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const model = await store.getBillingReadModel(PROJECT_ID);
      expect(model!.invoices).toHaveLength(1);
      expect(model!.revision).toBe(1);
    });
  });

  describe("getInvoice", () => {
    it("returns null for unknown invoice", async () => {
      expect(await store.getInvoice(PROJECT_ID, "nonexistent")).toBeNull();
    });

    it("returns the invoice after upsert", async () => {
      const created = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const found = await store.getInvoice(PROJECT_ID, created.invoiceId);
      expect(found).not.toBeNull();
      expect(found!.invoiceId).toBe(created.invoiceId);
    });
  });

  describe("upsertInvoice", () => {
    it("generates invoiceId when not provided", async () => {
      const created = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      expect(created.invoiceId).toBeTruthy();
    });

    it("uses provided invoiceId", async () => {
      const created = await store.upsertInvoice(PROJECT_ID, {
        ...VALID_INVOICE,
        invoiceId: "custom-id",
      });
      expect(created.invoiceId).toBe("custom-id");
    });

    it("overwrites existing invoice with same ID", async () => {
      const created = await store.upsertInvoice(PROJECT_ID, {
        ...VALID_INVOICE,
        invoiceId: "inv-1",
      });
      await store.upsertInvoice(PROJECT_ID, {
        ...VALID_INVOICE,
        invoiceId: "inv-1",
        status: "paid",
      });
      const found = await store.getInvoice(PROJECT_ID, "inv-1");
      expect(found!.status).toBe("paid");
    });
  });

  describe("recordPayment", () => {
    it("creates a new payment record", async () => {
      const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const payment = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      expect(payment.paymentId).toBeTruthy();
      expect(payment.invoiceId).toBe(inv.invoiceId);
      expect(payment.amount).toBe(500);
      expect(payment.recordedBy).toBe("operator@example.com");
    });

    it("is idempotent for exact tuple match", async () => {
      const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const payment1 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      const payment2 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      expect(payment2.paymentId).toBe(payment1.paymentId);
    });

    it("creates separate payments for different recordedBy", async () => {
      const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const payment1 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator-a@example.com",
      });
      const payment2 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator-b@example.com",
      });
      expect(payment2.paymentId).not.toBe(payment1.paymentId);
    });

    it("creates separate payments for different amounts", async () => {
      const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
      const payment1 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 500,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      const payment2 = await store.recordPayment(PROJECT_ID, inv.invoiceId, {
        amount: 300,
        currency: "EUR",
        recordedBy: "operator@example.com",
      });
      expect(payment2.paymentId).not.toBe(payment1.paymentId);
    });
  });
});
