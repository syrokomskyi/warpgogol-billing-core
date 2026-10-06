/*
<MODULE_CONTRACT>
<purpose>
RFC-1212: the ingestion port for journaled agent usage records — the pull-model
billing boundary. The agent gate emits `gogol.agent-usage/1` records to its
journal; the site-side bridge (werkstatt-site/src/billing) drains the journal
and calls {@link ingestUsageRecords} here. This module validates each record,
maps billable ones to meter events for usage-based billing, and reports
per-record outcomes — transport failures keep the record unprocessed so the
bridge retries on the next pass. The wire schema is validated locally (the
vendored-contract precedent): billing-core does not import agent contracts.
</purpose>
<non-goals>
  <item>Do not write invoices or payments — usage records feed metered
        billing, not the read-model entities.</item>
  <item>Do not call Stripe or any network — the sink is a port injected by
        the site adapter.</item>
  <item>Do not re-emit free-allowance logic — `billable` is the gate's
        verdict; this port trusts it (the gate owns window accounting).</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1212: initial ingestion port — record validation + meter-event mapping + pull-model sink contract.</item>
</CHANGE_SUMMARY>
*/

import { z } from "zod";

/** RFC-1212: local validation of the `gogol.agent-usage/1` wire record. */
export const billingUsageRecordSchema = z
  .object({
    schema: z.literal("gogol.agent-usage/1"),
    siteId: z.string().min(1),
    capability: z.string().min(1),
    callerIdentity: z.string().min(1),
    units: z.number().int().positive(),
    billable: z.boolean(),
    idempotencyKey: z.string().min(1).optional(),
    occurredAt: z.string().min(1),
  })
  .strict();

export type BillingUsageRecord = z.infer<typeof billingUsageRecordSchema>;

/**
 * One meter event handed to the usage-based billing backend — the shape a
 * Stripe meter event (or equivalent adapter) consumes. `dedupKey` is the
 * caller's Idempotency-Key when present, else a deterministic
 * site/capability/identity/timestamp composite — a drained record is never
 * billed twice across bridge retries.
 */
export interface UsageMeterEvent {
  /** Billing meter event name — the catalog product key. */
  meterEventName: string;
  /** Billing identity the usage is attributed to (pseudonymous). */
  customerRef: string;
  units: number;
  occurredAt: string;
  dedupKey: string;
}

/**
 * Sink port the site adapter implements (Stripe metered billing in
 * production; in-memory collector in tests). Throwing marks the record
 * unprocessed — the caller keeps it in the journal for retry.
 */
export type BillingUsageSink = (event: UsageMeterEvent) => Promise<void>;

/** Map a validated usage record to its meter event; null when non-billable. */
export function usageRecordToMeterEvent(record: BillingUsageRecord): UsageMeterEvent | null {
  if (!record.billable) return null;
  return {
    meterEventName: record.capability,
    customerRef: record.callerIdentity,
    units: record.units,
    occurredAt: record.occurredAt,
    dedupKey:
      record.idempotencyKey ??
      `${record.siteId}:${record.capability}:${record.callerIdentity}:${record.occurredAt}`,
  };
}

export interface UsageIngestionResult {
  /** Records that validated and produced a delivered meter event. */
  ingested: number;
  /** Records that validated but carried billable=false (free allowance). */
  free: number;
  /** Records rejected by the wire schema — skipped, left to the operator. */
  malformed: number;
  /** Records whose sink threw — caller keeps them journaled for retry. */
  failed: number;
}

/**
 * Pull-model ingestion: validate each raw record, map billable ones to meter
 * events, deliver via the injected sink. Malformed records are counted and
 * skipped (they never block the batch); sink failures are counted and left
 * for the caller's next pass — the function itself never throws.
 */
export async function ingestUsageRecords(
  records: readonly unknown[],
  sink: BillingUsageSink,
): Promise<UsageIngestionResult> {
  const result: UsageIngestionResult = { ingested: 0, free: 0, malformed: 0, failed: 0 };
  for (const raw of records) {
    const parsed = billingUsageRecordSchema.safeParse(raw);
    if (!parsed.success) {
      result.malformed++;
      continue;
    }
    const event = usageRecordToMeterEvent(parsed.data);
    if (event === null) {
      result.free++;
      continue;
    }
    try {
      await sink(event);
      result.ingested++;
    } catch {
      result.failed++;
    }
  }
  return result;
}
