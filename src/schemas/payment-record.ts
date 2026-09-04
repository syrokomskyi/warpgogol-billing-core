/*
<MODULE_CONTRACT>
<purpose>Zod schema for PaymentRecordV1, the immutable record created when an operator records a payment.</purpose>
<non-goals><item>Do not define invoice or read-model schemas here — use dedicated modules.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial PaymentRecordV1 Zod schema.</item></CHANGE_SUMMARY>
*/

import { z } from "zod";

export const paymentRecordV1Schema = z.object({
  paymentId: z.string().min(1),
  invoiceId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  recordedAt: z.string().min(1),
  recordedBy: z.string().min(1),
});

export type PaymentRecordV1 = z.infer<typeof paymentRecordV1Schema>;
