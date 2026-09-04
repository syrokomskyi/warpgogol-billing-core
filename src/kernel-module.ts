/*
<MODULE_CONTRACT>
<purpose>Register the billing kernel module with three workspace-scoped commands: billing.invoice.list, billing.invoice.show, billing.payment.record.</purpose>
<non-goals><item>Do not implement storage logic or provider credentials — that is the adapter's responsibility.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial billing kernel module with three commands.</item></CHANGE_SUMMARY>
*/

import type { KernelModule, KernelRuntimeContext } from "@warpgogol/werkstatt-engine/kernel";
import type { BillingStore } from "./billing-store.ts";
import { createInvoiceListCommand } from "./commands/invoice-list.ts";
import { createInvoiceShowCommand } from "./commands/invoice-show.ts";
import { createPaymentRecordCommand } from "./commands/payment-record.ts";

export type BillingStoreResolver = (context: KernelRuntimeContext) => Promise<BillingStore | null>;

export function createBillingKernelModule(
  resolveStore: BillingStoreResolver = () => Promise.resolve(null),
): KernelModule {
  return {
    name: "billing",
    version: "0.1.0",
    register(registry) {
      registry.registerCommand(createInvoiceListCommand(resolveStore));
      registry.registerCommand(createInvoiceShowCommand(resolveStore));
      registry.registerCommand(createPaymentRecordCommand(resolveStore));
    },
  };
}

export const billingKernelModule = createBillingKernelModule();
