/*
<MODULE_CONTRACT>
<purpose>In-memory BillingStore implementation for unit and property-based tests. Not for production use.</purpose>
<non-goals><item>Do not use in production — use a real adapter (e.g. D1-backed).</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial in-memory BillingStore for tests.</item></CHANGE_SUMMARY>
*/

import type { BillingStore } from "./billing-store.ts";
import { nextRevision } from "./billing-revision.ts";
import type { BillingReadModel, InvoiceV1, PaymentRecordV1 } from "./schemas/index.ts";
import { invoiceV1Schema } from "./schemas/invoice.ts";
import { paymentRecordV1Schema } from "./schemas/payment-record.ts";

interface ProjectData {
  invoices: Map<string, InvoiceV1>;
  payments: PaymentRecordV1[];
  revision: number;
}

export class InMemoryBillingStore implements BillingStore {
  private readonly projects = new Map<string, ProjectData>();

  private getProject(projectId: string): ProjectData {
    let project = this.projects.get(projectId);
    if (!project) {
      project = { invoices: new Map(), payments: [], revision: 0 };
      this.projects.set(projectId, project);
    }
    return project;
  }

  async getRevision(projectId: string): Promise<number> {
    return this.getProject(projectId).revision;
  }

  async getBillingReadModel(projectId: string): Promise<BillingReadModel | null> {
    const project = this.getProject(projectId);
    return {
      schema: "warpgogol.billing-read-model@1",
      revision: project.revision,
      invoices: [...project.invoices.values()],
      observedAt: new Date().toISOString(),
    };
  }

  async getInvoice(projectId: string, invoiceId: string): Promise<InvoiceV1 | null> {
    const project = this.getProject(projectId);
    return project.invoices.get(invoiceId) ?? null;
  }

  async upsertInvoice(
    projectId: string,
    invoice: Omit<InvoiceV1, "invoiceId"> & { invoiceId?: string },
  ): Promise<InvoiceV1> {
    const project = this.getProject(projectId);
    const id = invoice.invoiceId ?? crypto.randomUUID();
    const fullInvoice = invoiceV1Schema.parse({ ...invoice, invoiceId: id });
    project.invoices.set(id, fullInvoice);
    project.revision = nextRevision(project.revision);
    return fullInvoice;
  }

  async recordPayment(
    projectId: string,
    invoiceId: string,
    payment: Omit<PaymentRecordV1, "paymentId" | "recordedAt" | "invoiceId">,
  ): Promise<PaymentRecordV1> {
    const project = this.getProject(projectId);

    const existing = project.payments.find(
      (p) =>
        p.invoiceId === invoiceId &&
        p.amount === payment.amount &&
        p.currency === payment.currency &&
        p.recordedBy === payment.recordedBy,
    );
    if (existing) return existing;

    const record = paymentRecordV1Schema.parse({
      paymentId: crypto.randomUUID(),
      invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      recordedAt: new Date().toISOString(),
      recordedBy: payment.recordedBy,
    });
    project.payments.push(record);
    project.revision = nextRevision(project.revision);
    return record;
  }
}
