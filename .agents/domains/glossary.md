# Shared Glossary (Ubiquitous Language)

> Canonical domain terms for `retaila-dashboard`. Use these terms consistently in
> code, translation keys, and docs. Treat this as the single source of truth for
> naming money and retail concepts.

## Actors & roles

| Term | Meaning | Notes / code |
|---|---|---|
| Tenant | A business/merchant account; the top-level isolation scope | `tenant_id` on most records; multi-store retailer |
| Location | A physical store belonging to a tenant | `location_id`, reports break down by location |
| User / Team member | An authenticated operator | Roles: `ADMIN`, `CASHIER` |
| ADMIN | Full access; sees admin-only views (e.g. inventory overview) | `user.role === "ADMIN"` |
| CASHIER | Operational role; POS, sales | |
| Cashier | The human operating the POS register | Anomaly reports group by `user_id`/cashier |
| Customer | End buyer with optional debt, points, store credit | |

## Commercial entities

| Term | Meaning | Notes / code |
|---|---|---|
| POS (Point of Sale) | The sale screen; cart + checkout | `features/pos` |
| Product | Sellable item | `features/products` |
| Variant | A configuration of a product (attributes) | ≤100 per product, key/value attributes |
| Category | Groups products | `features/products`, `categoriesApi` |
| Discount | A product/order-level reduction | `discountsApi`, `features/discounts` |
| Promo code | A code customers apply at checkout for a deal | `promoCodesApi` |
| Order | A completed sale | `features/orders`, POS `OrdersTab` |
| Refund | Reversal of a sale | counted in cash ledger & anomaly detection |
| Cart | The in-progress set of items in POS | `useCart` in `features/pos/hooks.ts` |

## Vendors & purchasing

| Document | Meaning | Notes / code |
|---|---|---|
| Vendor | A supplier | `features/vendors` |
| Bill | A vendor invoice / payable | Billed by vendor |
| Purchase Order (PO) | Intent to buy from vendor | `purchaseOrders` query key |
| Receipt ingestion | OCR upload/review of vendor receipt | `multipart/form-data` flow |

## Money & accounting

| Term | Meaning | Notes / code |
|---|---|---|
| Cash ledger | Append-only ledger of cash events | `CashLedgerEntry`, `entry_type` |
| Entry type | Kind of ledger event (sale/refund/expense/vendor_payment/draw/contribution/adjustment) | badge/icon per type |
| EGP / ج.م | Egyptian pound; account currency | formatted via `lib/format.ts` (ar-EG) |
| Net position | Sales − refunds − expenses − vendor payments | `NetPositionResponse.net_position` |
| Business cash net | Same items; `business_cash_net` | |
| Working capital | Receivables − payables | |
| COGS / Cost of goods | Product cost to compute margin | `ProfitAndLoss.total_cogs`, gross profit |
| Gross profit / margin | revenue − COGS; margin % per group | `ProfitabilityRow` |
| P&L (Profit & Loss) | Full revenue/COGS/expense/profit statement | `reportsApi.profitAndLoss` |
| Owner equity | contributions − draws | `ownerEquity` |
| Runway | Operating cash ÷ avg daily burn → days | `RunwayEstimate.runway_days` |
| Break-even | Revenue needed to cover daily fixed costs | `BreakEvenEstimate` |
| Store credit | Balance customers can spend in-store | `features/store-credit`, pool + per-customer |
| Store-credit pool | Tenant-wide store-credit balance | `poolOverview`, `poolHistory` |
| Budget | Monthly spend limit per category | `features/budgets` (mock fallback) |

## Loyalty & risk

| Term | Meaning | Notes / code |
|---|---|---|
| Points / loyalty | Reward points on customer accounts; redeemable | `features/customers` |
| Points ledger | Per-customer points history | `pointsLedger` query key |
| Customer debt | Amount the customer owes | `DebtDialog`, `DebtDriftCheck` |
| Debt drift | Difference between recorded and computed debt | lifecycle check endpoint |
| Credit risk | Risk tier per customer (late payments, current debt) | `CustomerCreditRisk.risk_tier` |
| Anomaly | Unusual cashier behavior (refund/discount rates vs tenant avg) | refund/discount anomaly detection |

## Operational

| Term | Meaning | Notes / code |
|---|---|---|
| Reconciliation | Comparing expected vs counted cash per location | `reconciliationApi` (page is placeholder) |
| External transaction | A transaction entered for matching, then auto/manual matched to ledger entries | `match_status: UNMATCHED/AUTO_MATCHED/MANUALLY_MATCHED/NO_MATCH_FOUND` |
| Anomaly thresholds | Multipliers that trigger refund/discount alerts | `AnomalyThresholds` |

## Technical terms

| Term | Meaning | Notes / code |
|---|---|---|
| Envelope | Backend response shape `{ status, message, data }` | unwrapped by `lib/api.ts` |
| queryKeys | Central React Query key factory | `lib/query-keys.ts` |
| Date range | URL-bound `?start=&end=` window used by report pages | `useDateRange()` |

> **Rule:** When you add a new domain concept, add its term here so naming stays
> consistent across UI strings, API fields, and code.