/*
<MODULE_CONTRACT>
<purpose>Barrel export for billing read projection contracts, schemas, and revision logic.</purpose>
<non-goals><item>Do not re-export kernel module or command handlers from this barrel — use the ./kernel subpath.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial billing read projection contracts and schemas.</item></CHANGE_SUMMARY>
*/

export { type InvoiceV1, invoiceV1Schema } from "./schemas/invoice.ts";
export { type PaymentRecordV1, paymentRecordV1Schema } from "./schemas/payment-record.ts";
export { type BillingReadModel, billingReadModelSchema } from "./schemas/billing-read-model.ts";
export type { BillingStore } from "./billing-store.ts";
export { nextRevision, isMonotonic, isGapTolerant } from "./billing-revision.ts";
export { InMemoryBillingStore } from "./in-memory-billing-store.ts";
