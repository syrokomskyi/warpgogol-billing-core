/*
<MODULE_CONTRACT>
<purpose>billing.payment.record command handler — records a manual operator payment and increments billing revision.</purpose>
<non-goals><item>Do not update invoice status — that is owned by the external billing system via upsertInvoice.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial billing.payment.record handler.</item></CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelRuntimeContext,
} from "@warpgogol/werkstatt-engine/kernel";
import type { BillingStore } from "../billing-store.ts";
import type { PaymentRecordV1 } from "../schemas/index.ts";

const modulePath =
  "packages/warpgogol-billing-core/src/commands/payment-record.ts";

export interface PaymentRecordData {
  command: string;
  payment: PaymentRecordV1 | null;
}

const PAYABLE_STATUSES = new Set(["due", "overdue"]);

export function createPaymentRecordCommand(storeResolver: (context: KernelRuntimeContext) => Promise<BillingStore | null>) {
  return {
    name: "billing.payment.record",
    modulePath,
    description: "Record a manual operator payment for an invoice. Requires --project-id, --invoice-id, --amount, --currency, --actor.",
    scope: "workspace" as const,
    mutatesState: true,
    requiresNetwork: false,
    cacheable: false,
    reads: [],
    writes: [],
    generates: [],
    flags: {
      "project-id": {
        kind: "string" as const,
        required: true,
        description: "UUIDv7 project identifier.",
      },
      "invoice-id": {
        kind: "string" as const,
        required: true,
        description: "UUIDv7 invoice identifier.",
      },
      amount: {
        kind: "string" as const,
        required: true,
        description: "Payment amount (numeric).",
      },
      currency: {
        kind: "string" as const,
        required: true,
        description: "ISO 4217 currency code (e.g. EUR).",
      },
      actor: {
        kind: "string" as const,
        required: true,
        description: "Operator handle recording the payment.",
      },
    },
    async execute(
      input: { flags: Record<string, boolean | string | string[]> },
      context: KernelRuntimeContext,
    ): Promise<KernelCommandResult<PaymentRecordData>> {
      const projectId = String(input.flags["project-id"]);
      const invoiceId = String(input.flags["invoice-id"]);
      const amount = Number(input.flags.amount);
      const currency = String(input.flags.currency);
      const actor = String(input.flags.actor);

      const store = await storeResolver(context);
      if (!store) {
        return {
          data: { command: "billing.payment.record", payment: null },
          exitCode: 1,
          summary: `[billing.payment.record] Billing store unavailable for project ${projectId}`,
          nextSteps: [{ action: "Ensure a billing store adapter is configured.", kind: "required" as const }],
        };
      }

      const invoice = await store.getInvoice(projectId, invoiceId);
      if (!invoice) {
        return {
          data: { command: "billing.payment.record", payment: null },
          exitCode: 1,
          summary: `[billing.payment.record] Invoice ${invoiceId} not found for project ${projectId}`,
          nextSteps: [{ action: `Run billing.invoice.list --project-id ${projectId} to see available invoices.`, kind: "required" as const }],
        };
      }

      if (!PAYABLE_STATUSES.has(invoice.status)) {
        return {
          data: { command: "billing.payment.record", payment: null },
          exitCode: 1,
          summary: `[billing.payment.record] Invoice ${invoiceId} is not in a payable state (status: ${invoice.status})`,
          nextSteps: [{ action: `Invoice must be in 'due' or 'overdue' state to record a payment. Current status: ${invoice.status}.`, kind: "required" as const }],
        };
      }

      if (invoice.currency !== currency) {
        return {
          data: { command: "billing.payment.record", payment: null },
          exitCode: 1,
          summary: `[billing.payment.record] Payment currency ${currency} does not match invoice currency ${invoice.currency}`,
          nextSteps: [{ action: `Use currency ${invoice.currency} to match the invoice.`, kind: "required" as const }],
        };
      }

      const payment = await store.recordPayment(projectId, invoiceId, {
        amount,
        currency,
        recordedBy: actor,
      });

      return {
        data: { command: "billing.payment.record", payment },
        exitCode: 0,
        summary: `[billing.payment.record] Payment recorded for invoice ${invoiceId} by operator ${actor}`,
        nextSteps: [],
      };
    },
  };
}
