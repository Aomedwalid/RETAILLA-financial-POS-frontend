# Vendors module — align frontend to backend (statement, returns, credits, payment channels, ledger import)

## Goal
Complete the Retaila Dashboard `/vendors` frontend to match the FastAPI backend in
`retaila/modules/vendors/`. The backend already ships: statement (running balance),
line-scoped returns, vendor credits, payment channels, and bill `return_amount` /
`net_amount`. The frontend currently renders these as ad-hoc `useState`+direct-API
calls with no statement/returns/credits/ledger UI. Rewire onto React Query, expose the
new capabilities, and keep the working receipt ingestion flow intact.

## Source of truth
`back/retaila/modules/vendors/{router,schemas,service,receipt_service,receipt_repository}.py`
+ migrations `039..043`. Backend is authoritative; the API envelope
`{ status, message, data }` is unwrapped by `lib/api.ts` — never double-unwrap. Only
raw `http` (multipart) for `/receipts/process`.

## Routes to mirror (all prefixed `/api/vendors`)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/` | list / create |
| GET/DELETE | `/{vendor_id}` | vendor / deactivate |
| GET | `/bills/outstanding` | BillResponse[] (has `vendor_name`) |
| GET | `/{vendor_id}/purchase-orders` | PurchaseOrderResponse[] (status PENDING\|RECEIVED) |
| POST | `/{vendor_id}/purchase-orders/{po}/receive` | PENDING -> RECEIVED |
| POST | `/{vendor_id}/purchase-orders/{po}/bills` | create bill (BillCreateRequest) |
| GET | `/{vendor_id}/bills` | BillResponse[] (?status=) |
| GET | `/{vendor_id}/overview` | VendorOverviewResponse |
| GET | `/{vendor_id}/statement` | VendorStatementResponse |
| POST | `/{vendor_id}/bills/{bill}/returns` | VendorReturnResponse |
| POST | `/{vendor_id}/bills/{bill}/payments` | VendorBillPaymentResponse |
| POST | `/{vendor_id}/receipts/process` | multipart file |
| POST | `/{vendor_id}/receipts/confirm` | ReceiptConfirmResponse |
| POST | `/{vendor_id}/receipts/manual` | ReceiptConfirmResponse |
| POST | `/{vendor_id}/ledger/import` | NOT LIVE on backend. Schema `LedgerImportRequest` only. Wire UI to this path; on 404 show "awaiting backend" note. No invented response model (`Promise<void>`); confirmation derived from submitted payload. |

## Types to reflect (snake_case)
- `BillResponse`: add `return_amount?`, `net_amount?`, `amount_paid?`, `amount_remaining?`;
  `po_id?`. Keep `status: UNPAID|PARTIALLY_PAID|PAID`.
- `PurchaseOrderResponse.status`: `PENDING | RECEIVED`.
- `VendorBillPaymentResponse`: `{ payment: { id, amount, payment_method, channel, notes, created_at, ... }, bill: BillResponse }`.
- `VendorReturnRequest` `{ lines: [{variant_id, quantity, unit_amount}], cash_refund_amount?, channel?, notes? }`;
  `VendorReturnResponse` `{ return_id, bill, credit?, lines, returned_total, cash_refunded_amount? }`.
- `VendorCreditResponse` `{ id, amount, remaining, source_bill_id?, notes?, created_at }`.
- `VendorStatementEvent` `{ event_type, entity_id, created_at, amount, amount_signed, detail?, running_balance }`;
  `VendorStatementResponse` `{ vendor_id, vendor_name, balance, available_credit, events[] }`.
- `Channel = "CASH" | "INSTAPAY" | "VODAFONE_CASH" | "OTHER"`.
- Payment methods: `CASH | DIGITAL | STORE_CREDIT`.
- `LedgerImportRequest` `{ records: [{invoice_ref, invoice_amount, return_amount, payments:[{amount,payment_date,channel_note?}]}], notes? }`.

## Model behavior (frontend display only)
- Statement running balance: positive = owe vendor, negative = credit.
- `available_credit = max(0, -balance)`; `vendor_credits` are not balance events.
- Returns decrement inventory, reduce `net_amount`, flip status; over-pay creates credit.
- Cash refund only when `cash_refund_amount <= returned_total` and `<= credit.amount`; else backend rejects (401/400). Frontend validates on submit and surfaces the message.

## Files
- `features/vendors/types.ts` — rewrite (backend-aligned + local state types).
- `features/vendors/api.ts` — add statement / return / ledger import; fix payment+channel.
- `features/vendors/hooks.ts` — add `useVendorStatement`, `useCreateVendorReturn`,
  `useLedgerImport`; invalidate narrowest (bill, statement, detail, POs).
- `features/vendors/validation.ts` — return + ledger validators.
- `lib/query-keys.ts` — add `vendors.statement`, `vendors.ledger`.
- `lib/lazy-modals.ts` — register `DynamicVendorReturnModal`, `DynamicLedgerImportModal`.
- New components: `StatementTab`, `VendorReturnModal`, `BillDetailPanel`, `LedgerImportModal`.
- Rewrite on React Query: `VendorDetailPanel`, `VendorOverviewTab` (add available_credit),
  `VendorPOTab` (receive PENDING), `VendorBillsTab`, `PayBillModal` (channel), `CreateBillModal`
  (return_amount), `DeactivateVendor`, `OutstandingBillsWidget`.
- Keep: receipt ingestion flow (`ReceiptIngestionModal`, `CreatePurchaseOrderModal`,
  `VariantEditor`, `SearchableSelect`) — already matches backend.
- `app/(main)/vendors/page.tsx` — add Statement tab, ledger import entry point.
- `lib/i18n/locales/{ar,en}.json` — new keys.

## Conventions
Arabic/RTL via `t()`, `font-data-table`, `bg-surface-container-*` tokens,
`material-symbols-outlined`. No hardcoded Arabic. No inline query keys. Panels/modal
media `lib/lazy-*`.
</content>