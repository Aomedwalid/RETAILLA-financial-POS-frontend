# Vendors Module — Refactor & Polish Plan

- **Date:** 2026-08-04
- **Scope:** `features/vendors/**` (frontend only; no backend contract changes)
- **Goal:** Reduce duplication, standardize formatting/localization, small a11y fixes — while preserving all business logic and the working receipt/purchase-order flow.

## Audit findings (verified)

1. **Formatter duplication + currency inconsistency.**
   - `lib/format.ts` `formatCurrency` is the app-wide canonical ar-EG/«ج.م» formatter.
   - `features/vendors/types.ts` (line 329) re-implements it as `fmt` (`features/vendors/types.ts`, exported). Output is byte-identical, but it duplicates canonical logic.
   - `ReceiptIngestionModal` hard-codes `$` + `value.toFixed(2)` in summary/line/bill productions and decorative `$` prefix spans (`features/vendors/components/ReceiptIngestionModal.tsx` lines 172, 416, 430, 442, 505), breaking the app's EGP/ar-EG convention.
   - `StatementTab` wraps `formatCurrency` in a redundant local `fmtCurrency` (`StatementTab.tsx` line 134).

2. **`Field`/`Section`/`VariantField` form primitives duplicated** across `ReceiptIngestionModal` and `CreatePurchaseOrderModal` (private, near-identical). Inline modal duplication is the codebase-wide convention (no shared `Modal` exists) — we keep modals inline but hoist the tiny form primitives.

3. **a11y:** untranslated hard-coded English `alt="Receipt preview"` (`ReceiptIngestionModal.tsx` line 273).

## Plan (single conventional commit)

1. `types.ts`: drop the re-implementation; `import { formatCurrency } from "@/lib/format"; export const fmt = formatCurrency;` — keeps all 12 call sites working, no visible change.
2. `StatementTab.tsx`: remove local `fmtCurrency`, call `formatCurrency` directly (2 sites).
3. `ReceiptIngestionModal.tsx`: use `formatCurrency` for line/grand totals and the confirm `billAmount`; remove decorative `$` prefix spans (adjust padding to `px-3`); translate the preview `alt` via a new `receipt.previewAlt` key.
4. `components/ui.tsx` (new): export shared `Field` + `FormSection`; refactor `ReceiptIngestionModal` (its local `Field`/`Section`) and `CreatePurchaseOrderModal` (its local `Field`) to use them. Pure JSX hoist — no behavior change.
5. `SearchableSelect.tsx`: add `role="combobox"`, `aria-haspopup`, `aria-expanded`, `role="listbox"/"option"` + `aria-selected`. Additive, safe.
6. Verify: `npx eslint features/vendors`, `npx tsc --noEmit`, `npm run build` (via tsc + build). Expect zero new errors; the pre-existing exhaustive-deps warnings in `CreatePurchaseOrderModal`/`ReceiptIngestionModal` may shift lines but not count.

### Non-goals / avoided
- No shared `Modal` primitive (would diverge from the app-wide inline convention and add regression risk across 40+ screens).
- No rewrite of the working draft/receipt/purchase-order state flows.
- No backend schema/API changes.

## Commit
`refactor(vendors): unify currency formatting and extract shared form primitives`