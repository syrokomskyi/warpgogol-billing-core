/*
<MODULE_CONTRACT>
<purpose>Zod schema for InvoiceV1, matching the invoices items definition in the vendored portal snapshot JSON Schema.</purpose>
<non-goals><item>Do not define payment or read-model schemas here — use dedicated modules.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial InvoiceV1 Zod schema.</item></CHANGE_SUMMARY>
*/

import { z } from "zod";

export const invoiceKindSchema = z.enum(["activation", "subscription", "other"]);

export const invoiceStatusSchema = z.enum([
  "issued",
  "due",
  "paid",
  "overdue",
  "cancelled",
  "corrected",
]);

export const invoiceV1Schema = z.object({
  invoiceId: z.string().min(1),
  kind: invoiceKindSchema,
  number: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: invoiceStatusSchema,
  issuedAt: z.string().nullable(),
  dueAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  pdfRef: z.string().min(1),
});

export type InvoiceV1 = z.infer<typeof invoiceV1Schema>;

export type InvoiceKind = z.infer<typeof invoiceKindSchema>;

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
