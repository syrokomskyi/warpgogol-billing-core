/*
<MODULE_CONTRACT>
<purpose>index barrel export for billing read projection contracts, schemas, and revision logic.</purpose>
<non-goals><item>Do not re-export kernel module or command handlers from this barrel — use the ./kernel subpath.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1012: initial billing read projection contracts and schemas.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

export { type InvoiceV1, invoiceV1Schema } from "./schemas/invoice.ts";
export { type PaymentRecordV1, paymentRecordV1Schema } from "./schemas/payment-record.ts";
export { type BillingReadModel, billingReadModelSchema } from "./schemas/billing-read-model.ts";
export type { BillingStore } from "./billing-store.ts";
export { nextRevision, isMonotonic, isGapTolerant } from "./billing-revision.ts";
export { InMemoryBillingStore } from "./in-memory-billing-store.ts";
export {
  billingUsageRecordSchema,
  usageRecordToMeterEvent,
  ingestUsageRecords,
  type BillingUsageRecord,
  type BillingUsageSink,
  type UsageIngestionResult,
  type UsageMeterEvent,
} from "./usage-metering.ts";
