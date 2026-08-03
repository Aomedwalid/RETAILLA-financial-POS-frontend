# Project Overview — Retaila Dashboard (`retaila-dashboard`)

> **Read this first.** This document is the mandatory entry point for any AI agent
> working in this repository. It explains what the project is, the tech stack, and
> where everything lives.

## What it is

**Retaila Dashboard** is a production-grade, Arabic-only (RTL) multi-store retail
management frontend. It is a thin client over a remote **FastAPI + Supabase**
backend and is optimized for a free-tier hosting model (Render). It is a fintech
"executive dashboard" covering:

- Point of Sale (POS) with cart, checkout, refunds, and promo codes
- Inventory, products, categories, variants, stock adjustments
- Customers with debts, points/loyalty, and store credit
- Vendors with bills, purchase orders, and receipt OCR ingestion
- Expenses and recurring expenses
- Financial reports: cash ledger, P&L, net position, working capital, runway,
  break-even, profitability, budget tracking, anomaly detection, reconciliations
- Team / user management (`ADMIN` / `CASHIER` roles)

## Tech stack (authoritative)

| Layer | Technology |
|---|---|
| Framework | Next.js `^16.2.10` (App Router) |
| UI library | React `^19.2.4` |
| Language | TypeScript `^6.0.3` (strict) |
| Styling | Tailwind CSS `^4` (`@tailwindcss/postcss`), Material Design 3 dark tokens |
| Server state | TanStack React Query `^5.101.2` |
| HTTP | axios `^1.18.1` (single instance, interceptors, token refresh) |
| i18n | i18next `^26.3.6` + react-i18next `^17.0.11` (Arabic only) |
| Charts | recharts `^2.15.3` |
| Excel export | xlsx `^0.18.5` |
| Icons | Google Material Symbols font (NOT lucide-react) |
| Backend (out of repo) | FastAPI, response envelope `{ status, message, data }`, snake_case fields |

## Key facts agents MUST know

1. **The app is a client-rendered SPA** under the Next.js App Router. Nearly all
   pages are `"use client"`. Only `app/page.tsx`, `app/layout.tsx`,
   `app/not-found.tsx`, `reconciliation/page.tsx`, and `settings/page.tsx` are
   server components.
2. **RTL + Arabic are hard-wired.** `<html lang="ar" dir="rtl" className="dark">`.
   All new UI must use logical CSS properties and the `rtl:` Tailwind variant.
   Do not add English LTR layouts.
3. **The backend envelopes every response as `{ status, message, data }`.**
   `lib/api.ts` unwraps `.data` automatically. Raw `http` usage must unwrap manually.
4. **Auth is cookie-refresh based.** The access token is held in a module-scope
   variable (memory only), NOT localStorage/cookies on the client. Reloads re-auth
   via `POST /api/auth/refresh` (httpOnly cookie). See `authentication.md`.
5. **There is no middleware and no server-side auth check.** Route protection is
   client-side via `(auth)/layout.tsx` and `(main)/layout.tsx` `AuthGate`.
6. **The backend lives on a free Render host** that sleeps when idle.
   `components/KeepAliveProvider.tsx` + `lib/keep-alive.ts` ping it during visible
   activity. Don't break this.
7. **Date range is URL-driven** (`?start=&end=`) via `DateRangeContext`. New report
   pages should consume `useDateRange()` + `DateRangePopover`.

## Directory map

```
app/                    Routes (route groups: (auth) public, (main) authenticated)
components/             Cross-cutting UI (AppShell, Providers, KeepAliveProvider, ui/Toasts)
contexts/               SidebarContext (the only context outside lib)
features/<feature>/     Per-feature modules: types.ts, api.ts, hooks.ts, validation.ts, components/
lib/                    Core infra: api.ts, axios.ts, query-provider.tsx, query-keys.ts,
                        lazy-modals.ts, lazy-dynamic.tsx, keep-alive.ts, excel.ts, format.ts,
                        hooks/, filters/, auth/, i18n/
public/                 Static assets
.agents/                AI knowledge base (this tree) + installed skills
```

## Documentation index

The rest of the knowledge base lives in:

- `context/` — project overview (this file), frontend architecture, tech stack
- `domains/` — business domain knowledge and shared glossary
- `rules/` — binding conventions for writing code

See `.agents/README.md` for the full index, or the root `AGENTS.md` which is the
entry point and summarizes everything.
