/*
<MODULE_CONTRACT>
<purpose>Zod schema for BillingReadModel, the versioned projection consumed by PortalProjection.</purpose>
<non-goals><item>Do not define invoice or payment schemas here — import from dedicated modules.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial BillingReadModel Zod schema.</item></CHANGE_SUMMARY>
*/

import { z } from "zod";
import { invoiceV1Schema } from "./invoice.ts";

export const billingReadModelSchema = z.object({
  schema: z.literal("warpgogol.billing-read-model@1"),
  revision: z.number().int().min(0),
  invoices: z.array(invoiceV1Schema),
  observedAt: z.string().min(1),
});

export type BillingReadModel = z.infer<typeof billingReadModelSchema>;
