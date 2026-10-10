import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryBillingStore } from "../in-memory-billing-store.ts";
import { createInvoiceListCommand } from "../commands/invoice-list.ts";
import { createInvoiceShowCommand } from "../commands/invoice-show.ts";
import { createPaymentRecordCommand } from "../commands/payment-record.ts";
import type { InvoiceV1 } from "../schemas/index.ts";
import type { KernelRuntimeContext } from "@warpgogol/werkstatt-engine/kernel";

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

function mockContext(): KernelRuntimeContext {
  return {
    workspaceRoot: "/tmp/test",
    siteExplicit: false,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
      success: () => {},
      section: () => {},
      event: () => {},
      getEvents: () => [],
    },
    dryRun: false,
    outputFormat: "json",
    io: {
      readFile: async () => "",
      writeFile: async () => {},
      mkdir: async () => {},
      readdir: async () => [],
      stat: async () => ({}),
    } as any,
    actualState: {
      commands: new Map(),
      commandModules: new Map(),
      pipelines: new Map(),
      registerCommand: () => {},
      registerPipeline: () => {},
    } as any,
  };
}

describe("billing.invoice.list", () => {
  let store: InMemoryBillingStore;
  let command: ReturnType<typeof createInvoiceListCommand>;

  beforeEach(() => {
    store = new InMemoryBillingStore();
    command = createInvoiceListCommand(async () => store);
  });

  it("returns empty list with revision 0 for unknown project", async () => {
    const result = await command.execute({ flags: { "project-id": PROJECT_ID } }, mockContext());
    expect(result.exitCode).toBe(0);
    expect(result.data?.revision).toBe(0);
    expect(result.data?.invoices).toEqual([]);
  });

  it("returns invoices after upsert", async () => {
    await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
    const result = await command.execute({ flags: { "project-id": PROJECT_ID } }, mockContext());
    expect(result.exitCode).toBe(0);
    expect(result.data?.revision).toBe(1);
    expect(result.data?.invoices).toHaveLength(1);
  });

  it("fails when store unavailable", async () => {
    const cmd = createInvoiceListCommand(async () => null);
    const result = await cmd.execute({ flags: { "project-id": PROJECT_ID } }, mockContext());
    expect(result.exitCode).toBe(1);
  });
});

describe("billing.invoice.show", () => {
  let store: InMemoryBillingStore;
  let command: ReturnType<typeof createInvoiceShowCommand>;

  beforeEach(() => {
    store = new InMemoryBillingStore();
    command = createInvoiceShowCommand(async () => store);
  });

  it("returns invoice when found", async () => {
    const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
    const result = await command.execute(
      { flags: { "project-id": PROJECT_ID, "invoice-id": inv.invoiceId } },
      mockContext(),
    );
    expect(result.exitCode).toBe(0);
    expect(result.data?.invoice).not.toBeNull();
    expect(result.data?.invoice?.invoiceId).toBe(inv.invoiceId);
  });

  it("fails when invoice not found", async () => {
    const result = await command.execute(
      { flags: { "project-id": PROJECT_ID, "invoice-id": "nonexistent" } },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
    expect(result.data?.invoice).toBeNull();
  });

  it("fails when store unavailable", async () => {
    const cmd = createInvoiceShowCommand(async () => null);
    const result = await cmd.execute(
      { flags: { "project-id": PROJECT_ID, "invoice-id": "x" } },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
  });
});

describe("billing.payment.record", () => {
  let store: InMemoryBillingStore;
  let command: ReturnType<typeof createPaymentRecordCommand>;

  beforeEach(() => {
    store = new InMemoryBillingStore();
    command = createPaymentRecordCommand(async () => store);
  });

  it("records a payment for a due invoice", async () => {
    const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
    const result = await command.execute(
      {
        flags: {
          "project-id": PROJECT_ID,
          "invoice-id": inv.invoiceId,
          amount: "500",
          currency: "EUR",
          actor: "operator@example.com",
        },
      },
      mockContext(),
    );
    expect(result.exitCode).toBe(0);
    expect(result.data?.payment).not.toBeNull();
    expect(result.data?.payment?.amount).toBe(500);
  });

  it("fails when invoice not found", async () => {
    const result = await command.execute(
      {
        flags: {
          "project-id": PROJECT_ID,
          "invoice-id": "nonexistent",
          amount: "500",
          currency: "EUR",
          actor: "operator@example.com",
        },
      },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
  });

  it("fails when invoice status is not payable", async () => {
    const inv = await store.upsertInvoice(PROJECT_ID, { ...VALID_INVOICE, status: "paid" });
    const result = await command.execute(
      {
        flags: {
          "project-id": PROJECT_ID,
          "invoice-id": inv.invoiceId,
          amount: "500",
          currency: "EUR",
          actor: "operator@example.com",
        },
      },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
    expect(result.summary).toContain("not in a payable state");
  });

  it("fails when currency mismatch", async () => {
    const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
    const result = await command.execute(
      {
        flags: {
          "project-id": PROJECT_ID,
          "invoice-id": inv.invoiceId,
          amount: "500",
          currency: "USD",
          actor: "operator@example.com",
        },
      },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
    expect(result.summary).toContain("currency");
  });

  it("is idempotent for exact tuple match", async () => {
    const inv = await store.upsertInvoice(PROJECT_ID, VALID_INVOICE);
    const flags = {
      "project-id": PROJECT_ID,
      "invoice-id": inv.invoiceId,
      amount: "500",
      currency: "EUR",
      actor: "operator@example.com",
    };
    const result1 = await command.execute({ flags }, mockContext());
    const result2 = await command.execute({ flags }, mockContext());
    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);
    expect(result2.data?.payment?.paymentId).toBe(result1.data?.payment?.paymentId);
  });

  it("fails when store unavailable", async () => {
    const cmd = createPaymentRecordCommand(async () => null);
    const result = await cmd.execute(
      {
        flags: {
          "project-id": PROJECT_ID,
          "invoice-id": "x",
          amount: "500",
          currency: "EUR",
          actor: "op@example.com",
        },
      },
      mockContext(),
    );
    expect(result.exitCode).toBe(1);
  });
});
