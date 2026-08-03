# Frontend Architecture

> Binding conventions for the overall structure of `retaila-dashboard`.
> Apply these when adding or reorganizing code.

## Layering model

The app is organized in four layers. Dependencies point downward only.

```
app/                 → Pages, route groups, layouts (composition only)
features/<feature>/  → Feature modules (domain logic + feature UI)
components/          → Cross-cutting UI shell and primitives
lib/                 → Infrastructure: HTTP, React Query, i18n, auth, utils
```

- `app/` must never contain business logic or data fetching beyond what is needed
  to compose feature components. Pages wire together feature components and
  page-level UI state (tabs, URL params).
- `features/` own their domain. Their files are exported internally to the page.
- `components/` holds shared shell (`AppShell`, `Sidebar`, `TopBar`, `Providers`)
  and `ui/` primitives (`Toast`). Do not put feature-specific UI here.
- `lib/` is infra only. Nothing in `lib/` may import from `features/` or `components/`.

## Feature module pattern

Every feature directory follows a consistent shape (not all files are mandatory):

```
features/<name>/
  types.ts          Domain + API types (payloads, responses, PaginatedResponse<T>)
  api.ts            API object: <name>Api = { list, get, create, update, delete, ... }
  hooks.ts          React Query hooks wrapping the api object
  validation.ts     Pure validation functions taking (data, t) → ValidationErrors
  components/       Feature-specific UI (modals, tables, forms, cards)
```

Rules:

- `types.ts` also owns UI helpers/constants that are shared within the feature
  (e.g. `features/expenses/types.ts` exports `categoryLabel`, badges, currency
  formatting helpers). This is acceptable because it's a module, not a component.
- `api.ts` must be a thin wrapper over `@/lib/api`. Do not call `http` directly
  except for `multipart/form-data` uploads (see `features/vendors/api.ts`).
- `hooks.ts` maps 1:1 to API methods: `useXList`, `useXDetail`, `useCreateX`,
  `useUpdateX`, `useDeleteX`. Mutations invalidate the correct `queryKeys`.
- `validation.ts` is a pure module — no React, no hooks. Signature:
  `validateX(data, t): ValidationErrors` where `t` is the i18next `t` function
  and `ValidationErrors = Record<string, string>`.

## Where API modules live

- Feature CRUD APIs live in `features/<name>/api.ts` (`productsApi`, `customersApi`,
  `vendorsApi`, `discountsApi`, `promoCodesApi`, `usersApi`, `posApi`, `ordersApi`,
  `expensesApi`, `budgetsApi`, `storeCreditApi`).
- Aggregated **reports** APIs live in `lib/api.ts` (`reportsApi`, `reconciliationApi`,
  `authApi`). Keep them there — they span many pages.
- `reconciliation` is special: its API functions live in `lib/api.ts`
  (`reconciliationApi`) while its types are re-declared in
  `features/reconciliation/types.ts`. When wiring the upcoming reconciliation page,
  prefer using `reconciliationApi` from `lib/api.ts`.

## Lazy loading registries

Heavy UI is lazy-loaded through **two central registries** instead of direct imports:

1. `lib/lazy-modals.ts` — `next/dynamic(..., { ssr: false })` wrappers for all
   modals / slide-overs / panels (create/edit forms, detail modals, dialogs,
   checkout, orders tab, vendor panels).
2. `lib/lazy-dynamic.tsx` — `next/dynamic` wrappers for the 12 dashboard report
   cards, each with a skeleton fallback.

**Rule:** when adding a new modal, dialog, slide-over, or dashboard report card,
register it in the matching registry and import the registry entry in the page —
do NOT import the heavy component directly into the page bundle.

## Shared infrastructure in `lib/`

| File | Responsibility | Agent rule |
|---|---|---|
| `lib/api.ts` | `api.{get,post,put,patch,delete}`, `ApiError`, `reportsApi`, `reconciliationApi`, `authApi`, shared types | Always go through `api.*`; catch `ApiError` for messages |
| `lib/axios.ts` | axios instance, interceptors, in-memory token, refresh/retry, unauthorized handler | Never import directly except multipart uploads |
| `lib/query-provider.tsx` | QueryClient config | Do not create per-feature QueryClients |
| `lib/query-keys.ts` | `queryKeys` factory | Prefer factories over inline string keys |
| `lib/lazy-modals.ts` / `lib/lazy-dynamic.tsx` | Dynamic import registries | Register heavy components here |
| `lib/excel.ts` | `ExcelColumn<T>`, `buildWorkbook`, `buildFileName`, `downloadBlob` | Reuse for any Excel export |
| `lib/format.ts` | `formatCurrency`, `formatPercent`, `formatNumber`, `formatDate`, `formatDateTime` (ar-EG) | Always use for user-facing money/dates |
| `lib/hooks/` | `useMediaQuery`, `useClickOutside` | Reuse instead of re-implementing |
| `lib/filters/` | `DateRangeContext`, `useDateRange`, presets | Report pages must use these |
| `lib/auth/` | `AuthContext`, `passwordStrength` | Auth flows go through `useAuth()` |

## Anti-patterns

- ❌ Feature code importing from another feature's `components/` directly.
  Cross-feature needs should be lifted to `components/` or composed at the page.
- ❌ New QueryClients or duplicated axios instances.
- ❌ Barrel files (`index.ts` re-exporting everything) — import from source files
  directly to keep bundles analyzable (see `vercel-react-best-practices` skill).
- ❌ Placing fetch logic directly in `app/` pages. Data fetching lives in feature
  `api.ts`/`hooks.ts` or `lib/api.ts`.
