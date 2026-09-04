# @warpgogol/warpgogol-billing-core

Provider-neutral billing read projection contracts, schemas, and kernel commands.

Implements [RFC-1012](../../docs/rfcs/rfc-1012-billing-read-projection-and-pdf-references.md): Billing read projection and PDF references.

## Overview

- **Zod schemas** for `InvoiceV1`, `PaymentRecordV1`, `BillingReadModel`
- **`BillingStore` port interface** — adapter contract for D1, in-memory, or other backends
- **Monotonic revision allocation** — pure functions for gap-tolerant revision sequences
- **Kernel commands**: `billing.invoice.list`, `billing.invoice.show`, `billing.payment.record`

## Usage

```ts
import { invoiceV1Schema, type InvoiceV1 } from "@warpgogol/warpgogol-billing-core/schemas";
import type { BillingStore } from "@warpgogol/warpgogol-billing-core/ports";
```
