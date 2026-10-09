/*
<MODULE_CONTRACT>
<purpose>billing.invoice.list command handler — returns the billing read model for a project.</purpose>
<non-goals><item>Do not mutate billing state — this is a read-only command.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial billing.invoice.list handler.</item></CHANGE_SUMMARY>
*/

import type { KernelCommandResult, KernelRuntimeContext } from "@warpgogol/werkstatt-engine/kernel";
import type { BillingStore } from "../billing-store.ts";

const modulePath = "packages/warpgogol-billing-core/src/commands/invoice-list.ts";

export interface InvoiceListData {
  command: string;
  projectId: string;
  revision: number;
  invoices: unknown[];
  observedAt: string;
}

export function createInvoiceListCommand(
  storeResolver: (context: KernelRuntimeContext) => Promise<BillingStore | null>,
) {
  return {
    name: "billing.invoice.list",
    coverage: "operator" as const,
    modulePath,
    description: "List all invoices for a project with billing revision. Requires --project-id.",
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
    },
    async execute(
      input: { flags: Record<string, boolean | string | string[]> },
      context: KernelRuntimeContext,
    ): Promise<KernelCommandResult<InvoiceListData>> {
      const projectId = String(input.flags["project-id"]);
      const store = await storeResolver(context);
      if (!store) {
        return {
          data: {
            command: "billing.invoice.list",
            projectId,
            revision: 0,
            invoices: [],
            observedAt: new Date().toISOString(),
          },
          exitCode: 1,
          summary: `[billing.invoice.list] Billing store unavailable for project ${projectId}`,
          nextSteps: [
            { action: "Ensure a billing store adapter is configured.", kind: "required" as const },
          ],
        };
      }

      const readModel = await store.getBillingReadModel(projectId);
      if (!readModel) {
        return {
          data: {
            command: "billing.invoice.list",
            projectId,
            revision: 0,
            invoices: [],
            observedAt: new Date().toISOString(),
          },
          exitCode: 1,
          summary: `[billing.invoice.list] Project ${projectId} not found`,
          nextSteps: [
            {
              action: `Run project.lifecycle.create to initialize project ${projectId}.`,
              kind: "required" as const,
            },
          ],
        };
      }

      return {
        data: {
          command: "billing.invoice.list",
          projectId,
          revision: readModel.revision,
          invoices: readModel.invoices,
          observedAt: readModel.observedAt,
        },
        exitCode: 0,
        summary: `[billing.invoice.list] Project ${projectId} billing revision ${readModel.revision}, ${readModel.invoices.length} invoices`,
        nextSteps: [],
      };
    },
  };
}
