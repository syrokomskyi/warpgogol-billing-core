/*
<MODULE_CONTRACT>
<purpose>BillingStore port interface — the adapter contract for billing data persistence and retrieval.</purpose>
<non-goals><item>Do not implement storage logic here — implementations belong in adapter packages.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial BillingStore port interface with upsertInvoice.</item></CHANGE_SUMMARY>
*/

import type { BillingReadModel, InvoiceV1, PaymentRecordV1 } from "./schemas/index.ts";

export interface BillingStore {
  getRevision(projectId: string): Promise<number>;
  getBillingReadModel(projectId: string): Promise<BillingReadModel | null>;
  getInvoice(projectId: string, invoiceId: string): Promise<InvoiceV1 | null>;
  upsertInvoice(
    projectId: string,
    invoice: Omit<InvoiceV1, "invoiceId"> & { invoiceId?: string },
  ): Promise<InvoiceV1>;
  recordPayment(
    projectId: string,
    invoiceId: string,
    payment: Omit<PaymentRecordV1, "paymentId" | "recordedAt" | "invoiceId">,
  ): Promise<PaymentRecordV1>;
}
