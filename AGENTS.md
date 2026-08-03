# AGENTS.md — Retaila Dashboard (`retaila-dashboard`)

> **Mandatory entry point for any AI agent working in this repository.** Read this
> before implementing a feature, fixing a bug, refactoring, or reviewing code. It
> summarizes what every agent must know and links the full knowledge base.

## 1. What this project is

A production-grade, **Arabic-only (RTL)** multi-store retail management frontend.
Next.js 16 App Router + React 19 + TypeScript (strict) + Tailwind 4 + TanStack
React Query + axios, talking to a remote **FastAPI + Supabase** backend
(envelope `{ status, message, data }`, snake_case). It is a client-rendered SPA
with a POS, inventory, customers, vendors, expenses, budgets, and a full suite of
financial reports.

**Read `context/project-overview.md` first** for the full picture and directory map.

## 2. Non-negotiable project facts (read `context/` before coding)

1. **RTL + Arabic are hard-wired** (`<html dir="rtl" lang="ar" class="dark">`).
   All UI uses logical CSS properties and `t("...")` for strings; no hardcoded
   Arabic. Numbers/dates are `ar-EG` via `lib/format.ts`.
2. **API envelope is unwrapped automatically** by `lib/api.ts`. Go through
   `api.*` (feature `api.ts` objects). Catch `ApiError` for messages.
3. **Auth is cookie-refresh based**; the access token is in-memory only
   (`lib/axios.ts`). No middleware; guards are client-side in `(auth)/` and `(main)/`.
4. **Heavy UI is lazy-loaded** through two registries
   (`lib/lazy-modals.ts` for modals/panels, `lib/lazy-dynamic.tsx` for dashboard
   cards). Don't import heavy modules directly into pages.
5. **Server state = React Query** with `queryKeys` factories
   (`lib/query-keys.ts`) — never inline literal keys.
6. **Report pages use `useDateRange()`** (`?start=&end=`), not local dates.
7. The free Render backend **sleeps when idle**; `KeepAliveProvider` + the axios
   interceptor keep it warm. Don't break this.

## 3. Where to look (glossary of terms)

| Term | Meaning |
|---|---|
| Tenant / Location | Business scope / physical store |
| Cash ledger | Append-only ledger of cash events (`entry_type`) |
| Net position / P&L / Runway / Break-even | Financial reports in `reportsApi` |
| Store credit | Prepaid customer balance (pool + per-customer) |
| Debt | What a customer owes (tracked separately from credit) |
| Anomaly | Cashier refund/discount rate vs tenant average |
| Reconciliation | Expected vs counted cash; external transactions matched to ledger |
| Budget | Monthly limit per category (mock fallback until backend live) |
| queryKeys / envelope / Date range | Technical concepts in the glossary |

Full ubiquitous language: **`domains/glossary.md`**. Domain models:
**`domains/business-domain.md`**.

## 4. Binding rules by work type

Read the relevant `rules/` file before doing that kind of work. A single task may
need several.

| When you are... | Read |
|---|---|
| Adding/editing UI | `rules/ui-conventions.md`, `rules/components.md` |
| Calling an API / adding an endpoint | `rules/api-integration.md` |
| Touching auth/login/session | `rules/authentication.md` |
| Adding a page / route | `rules/routing.md` |
| Adding server/client state | `rules/state-management.md` |
| Writing a form | `rules/forms-validation.md` |
| Adding/extending a feature module | `rules/feature-design.md` |
| Optimizing performance | `rules/performance.md` |
| Committing | `rules/git-workflow.md`, `skills/git-commit` |
| Debugging a bug | `skills/systematic-debugging` |
| Refactoring | `clean-code` (+ `request-refactor-plan` for big efforts) |
| Reviewing a diff | `skills/code-review` |
| Verifying/adding tests | `rules/testing.md`, `skills/webapp-testing` |
| Writing docs / translating | `rules/documentation-i18n.md` |
| Scanning for mistakes | `rules/common-pitfalls.md` |

## 5. Installed skills (loaded as needed)

The following skills live in `.agents/skills/`. Load the relevant one by name:

- **nextjs-app-router-patterns** — App Router/SSG/SSR conventions.
- **react-state-management** — Redux/Zustand/Jotai/React Query decisions.
- **responsive-design** — container queries, fluid type, breakpoints.
- **vercel-react-best-practices** — 70 React/Next performance rules (apply always).
- **webapp-testing** — Playwright browser verification (no harness committed).
- **accessibility** — WCAG 2.2 audit/improvement.
- **code-review** — two-axis (standards vs spec) diff review.
- **clean-code** — readability/refactor rigor.
- **systematic-debugging** — bug-investigation procedure.
- **git-commit** — conventional commit generation.
- **find-skills** — discover more skills.
- **supabase-postgres-best-practices** — ⚠️ only relevant if/when this repo owns
  Postgres schema; it does not (backend is separate), so it's inactive here.

## 6. Workflow checklist (for any task)

1. Read this `AGENTS.md`.
2. Load the skills/documents matching the work type (section 4).
3. Explore the relevant existing files first — copy established patterns
   (e.g. a feature `api.ts`, a modal, a validator) rather than inventing.
4. Implement.
5. Verify: `npm run lint`, `npx tsc --noEmit` (via build), `npm run build`, smoke
   test with `npm run dev`. See `rules/testing.md`.
6. Keep Arabic/RTL, the envelope pattern, `queryKeys`, and the lazy registries intact.
7. Update the affected `.agents/` docs + this file if you changed conventions,
   then commit via the `git-commit` skill (only when asked).

## 7. Directory map (quick)

```
app/                    Route groups: (auth) public, (main) authenticated
components/             AppShell, TopBar, Providers, ui/ (Toast), KeepAlive
contexts/               SidebarContext
features/<name>/        types.ts, api.ts, hooks.ts, validation.ts, components/
lib/                    api, axios, query-provider, query-keys, lazy-*, excel,
                        format, hooks/, filters/, auth/, i18n/
.agents/                this knowledge base + skills
```

## 8. Current known issues / placeholders (don't regress)

- `reconciliation/page.tsx` and `settings/page.tsx` are "coming soon" placeholders.
- Budgets API falls back to mock data until backend ships.
- Some pages (`budgets`, `team`, `CashPositionCard`) still use inline query keys —
  migrate to `queryKeys` when touched.
- No automated test harness exists yet.
- `POS_CART_BUGS_PROMPT.md` documents known POS cart bugs — read it before touching
  `features/pos/hooks.ts`.