/*
<MODULE_CONTRACT>
<purpose>schemas index barrel export for billing Zod schemas and inferred types.</purpose>
<non-goals><item>Do not re-export store interfaces or kernel modules from this barrel.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1012: initial schema barrel export.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

export {
  invoiceV1Schema,
  invoiceKindSchema,
  invoiceStatusSchema,
  type InvoiceV1,
  type InvoiceKind,
  type InvoiceStatus,
} from "./invoice.ts";
export { paymentRecordV1Schema, type PaymentRecordV1 } from "./payment-record.ts";
export { billingReadModelSchema, type BillingReadModel } from "./billing-read-model.ts";
