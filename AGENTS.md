# @warpgogol/warpgogol-billing-core — Agent Guide

**Workspace type:** Package Implements [RFC-1012](../../docs/rfcs/rfc-1012-billing-read-projection-and-pdf-references.md): Billing read projection and PDF references.

Provider-neutral billing read projection contracts, schemas, and kernel commands.

## Entry points

| Entry point                                 | Module                   |
| ------------------------------------------- | ------------------------ |
| `@warpgogol/warpgogol-billing-core`         | `./src/index.ts`         |
| `@warpgogol/warpgogol-billing-core/kernel`  | `./src/kernel/index.ts`  |
| `@warpgogol/warpgogol-billing-core/schemas` | `./src/schemas/index.ts` |
| `@warpgogol/warpgogol-billing-core/ports`   | `./src/billing-store.ts` |

## Commands

| Command | Scope | Mutates | Description |
| --- | --- | --- | --- |
| `billing.invoice.list` | workspace | no | List all invoices for a project with billing revision |
| `billing.invoice.show` | workspace | no | Show a single invoice by ID |
| `billing.payment.record` | workspace | yes | Record a manual operator payment |

## Architecture

- **Schemas** (`src/schemas/`): Zod schemas for `InvoiceV1`, `PaymentRecordV1`, `BillingReadModel` matching the vendored portal snapshot JSON Schema.
- **Port** (`src/billing-store.ts`): `BillingStore` interface — adapter contract for D1, in-memory, or other backends. Includes `upsertInvoice` for adapter-level invoice management.
- **Revision logic** (`src/billing-revision.ts`): Pure functions `nextRevision`, `isMonotonic`, `isGapTolerant` — no side effects, no I/O.
- **In-memory store** (`src/in-memory-billing-store.ts`): Test-only `BillingStore` implementation.
- **Commands** (`src/commands/`): Three kernel command handlers with DNA-82 compliant output.
- **Kernel module** (`src/kernel-module.ts`): Registers all three commands with workspace scope.

## Idempotency

`billing.payment.record` is idempotent per exact `(projectId, invoiceId, amount, currency, recordedBy)` tuple. Duplicate submissions return the existing `PaymentRecordV1`. No time window. Different `recordedBy` always creates a new payment.

## Scripts

| Script        | Command                                   |
| ------------- | ----------------------------------------- |
| `build:check` | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `test`        | `vitest run`                              |
| `lint`        | `pnpm exec eslint "src/**/*.ts"`          |
