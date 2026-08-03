# Domain Knowledge

> Business domain context for the money/finance areas of `retaila-dashboard`.
> Read this to understand the domain before implementing reports, budgets, or
> reconciliation. See `glossary.md` for term definitions.

## The multi-store retail cash model

Every tenant runs one or more **locations**. All money flows through a central
**cash ledger** where each event has an `entry_type`. The reports derive from that
ledger. The key mental model:

```
cash ledger entries (sales, refunds, expenses, vendor payments,
owner draws, owner contributions, adjustments)
        ↓
daily cash summary → net position → business cash position → profitability/P&L
        ↑
location breakdown
```

### Cash ledger entry types (from `CashLedgerEntry.entry_type`)
- `SALE` / sales
- `REFUND`
- `EXPENSE`
- `VENDOR_PAYMENT`
- `OWNER_DRAW`
- `OWNER_CONTRIBUTION`
- `ADJUSTMENT`

Each maps to a badge + icon in the UI (`app/(main)/money/page.tsx`). When adding a
new entry type, update the mapping there and in `features/expenses/types.ts` if it
overlaps expense categories.

## Money handling conventions

- Report payloads frequently carry money as **strings** (`"total_sales": "123.50"`).
  Do not assume `number`. Format all user-facing money with `lib/format.ts`
  `formatCurrency` (ar-EG, 2 decimals, `ج.م`).
- `net_position = total_sales - total_refunds - total_expenses - total_vendor_payments`.
- `business_cash_net` is the same set of items (used by the cash-position card).
- Margin: `(revenue - cogs) / revenue`; `ProfitabilityRow.margin_pct`.

## The financial statement reports

| Report | What it answers | Key fields |
|---|---|---|
| Net position | "What was the cash position for this period?" | `net_position` |
| Business cash position | Cash fore the business | `business_cash_net` |
| Working capital | Liquidity vs vendors/customers | receivables, payables, `net_working_capital` |
| P&L | Full profitability | `net_profit`, `gross_profit` |
| Owner equity | Owner money | `total_contributions`, `total_draws`, `net_equity_change` |
| Runway | "How many days of cash left?" | `operating_cash`, `avg_daily_burn`, `runway_days` |
| Break-even | "Daily revenue to break even?" | `avg_daily_fixed_costs`, `avg_margin_pct`, `break_even_daily_revenue` |
| Profitability | Margin by group/category | `gross_profit`, `margin_pct` |
| Payment methods | How customers paid | `payment_method`, `total_amount` |
| Daily summary | Per-day ledger totals | `DailyCashSummaryItem` |
| Locations | Per-store performance | `LocationPerformance` |
| Budgets | Category spend vs monthly limits | `BudgetStatusItem` (exceeded flag) |

## Anomaly detection (risk)

The dashboard flags unusual cashier behavior:

- **Refund anomaly**: a cashier's refund rate vs tenant average
  (`CashierRefundAnomaly`, `is_refund_anomaly`).
- **Discount anomaly**: discount usage rate vs tenant average
  (`CashierDiscountAnomaly`, `is_discount_anomaly`).
- Thresholds are multipliers (`AnomalyThresholds`: refund/discount/reconciliation
  alert multipliers), editable in settings.

**Rule:** these are advisory risk flags, not hard blocks. The UI presents them in
an anomaly feed on the dashboard. Do not change their meaning.

## Budgets

- A budget is a `monthly_limit` per `category`, with `active` flag and `notes`.
- `budgetStatus` returns per-category actual spend vs limit with an `exceeded` bool.
- The budget API currently **falls back to mock data** on 404/400/network errors
  (`features/budgets/api.ts`). Keep this fallback until the backend ships, but
  replicate it inside the feature `api.ts`, not in components.

## Reconciliation (page is a placeholder; domain is real)

- **Expected cash** vs **counted cash** per location/period → `discrepancy` + flag.
- **External transactions** are entered from outside systems, then **matched** to
  internal ledger entries: auto or manual.
- Match states: `UNMATCHED → AUTO_MATCHED | MANUALLY_MATCHED | NO_MATCH_FOUND`.
- `reconciliationApi.runMatching(date_tolerance_days)` runs the matcher.
- `features/reconciliation/types.ts` already re-declares the types; the API lives
  in `lib/api.ts` (`reconciliationApi`). Wire the page from `/api/reconciliation/*`.

## Store credit

- **Pool** = tenant-wide store-credit balance (`poolOverview`); supports
  deposit/withdraw.
- **Per-customer** balances (`storeCredit/<customerId>` page): overview card, usage
  gauge (SVG donut), ledger table, issue-credit modal, date filter.
- Contrast: store credit = prepaid balance the customer can spend; customer **debt**
  = what the customer owes. They're inverse and both tracked per customer.

## Retail operations

- **POS** flow: product grid (search/sort/category) → variant selection → cart
  (desktop panel / mobile drawer) → checkout dialog → payment dialog → promo code →
  create order. Refunds handled post-order (`RefundModal`, `OrdersTab`).
- **Inventory**: overview (admin), categories, products CRUD, variants, stock
  adjustments with a history modal.
- **Vendors**: list, outstanding bills, receipt OCR ingestion (upload → review
  lines → confirm).

## Dates & ranges

- Reports are scoped by a **date range** `?start=&end=` (last 30 days default),
  managed by `useDateRange()`. Presets: today / 7 / 30 / 90 days, this/last month,
  YTD (`lib/filters/dateRangePresets.ts`).
- Always drive a report from `useDateRange().{startDate,endDate}` — never a hard
  coded date.

## Authoritative source files

- `lib/api.ts` — all report/reconciliation/auth types & API methods.
- `lib/query-keys.ts` — query key namespaces per domain.
- `lib/format.ts` — currency/number/date formatting rules.
- `features/<feature>/types.ts` — feature-specific types and UI helpers.