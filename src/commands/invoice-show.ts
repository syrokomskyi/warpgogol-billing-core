/*
<MODULE_CONTRACT>
<purpose>billing.invoice.show command handler — returns a single invoice by ID.</purpose>
<non-goals><item>Do not mutate billing state — this is a read-only command.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial billing.invoice.show handler.</item></CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelRuntimeContext,
} from "@warpgogol/werkstatt-engine/kernel";
import type { BillingStore } from "../billing-store.ts";
import type { InvoiceV1 } from "../schemas/index.ts";

const modulePath =
  "packages/warpgogol-billing-core/src/commands/invoice-show.ts";

export interface InvoiceShowData {
  command: string;
  invoice: InvoiceV1 | null;
}

export function createInvoiceShowCommand(storeResolver: (context: KernelRuntimeContext) => Promise<BillingStore | null>) {
  return {
    name: "billing.invoice.show",
    modulePath,
    description: "Show a single invoice by ID for a project. Requires --project-id and --invoice-id.",
    scope: "workspace" as const,
    mutatesState: false,
    requiresNetwork: false,
    cacheable: false,
    reads: [],
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
    },
    async execute(
      input: { flags: Record<string, boolean | string | string[]> },
      context: KernelRuntimeContext,
    ): Promise<KernelCommandResult<InvoiceShowData>> {
      const projectId = String(input.flags["project-id"]);
      const invoiceId = String(input.flags["invoice-id"]);
      const store = await storeResolver(context);
      if (!store) {
        return {
          data: { command: "billing.invoice.show", invoice: null },
          exitCode: 1,
          summary: `[billing.invoice.show] Billing store unavailable for project ${projectId}`,
          nextSteps: [{ action: "Ensure a billing store adapter is configured.", kind: "required" as const }],
        };
      }

      const invoice = await store.getInvoice(projectId, invoiceId);
      if (!invoice) {
        return {
          data: { command: "billing.invoice.show", invoice: null },
          exitCode: 1,
          summary: `[billing.invoice.show] Invoice ${invoiceId} not found for project ${projectId}`,
          nextSteps: [{ action: `Verify the invoice ID and project ID. Run billing.invoice.list --project-id ${projectId} to see available invoices.`, kind: "required" as const }],
        };
      }

      return {
        data: { command: "billing.invoice.show", invoice },
        exitCode: 0,
        summary: `[billing.invoice.show] Invoice ${invoiceId} for project ${projectId}`,
        nextSteps: [],
      };
    },
  };
}
