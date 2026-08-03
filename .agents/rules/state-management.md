# State Management Rules

> Binding rules for client state in `retaila-dashboard`. Follow the 
> `react-state-management` skill for general guidance; this file pins the project's
> concrete decisions.

## The only server-state library: TanStack React Query

- A **single module-level `QueryClient`** lives in `lib/query-provider.tsx`.
  Do not create per-page/per-feature clients.
- Defaults (do not override casually):
  - queries: `retry: 2`, `staleTime: 30_000`, `gcTime: 5 * 60 * 1000`,
    `refetchOnWindowFocus: false`, `refetchOnReconnect: true`
  - mutations: `retry: 0`
- Query hooks live in `features/<name>/hooks.ts` and wrap the feature `api` object.
  Naming: `useXList`, `useXDetail`, `useCreateX`, `useUpdateX`, `useDeleteX`.

## Query keys: use the factory

`lib/query-keys.ts` exports `queryKeys` — a namespaced factory of `as const` keys:

```ts
queryKeys.products.list(params)   // ["products", "list", params]
queryKeys.customers.detail(id)    // ["customers", "detail", id]
queryKeys.reports.cashLedger(params)
queryKeys.pos.cart()
```

Rules:

- **Always use `queryKeys` factories** for `queryKey` and for invalidation in
  mutations.
- **Known inconsistency (do not replicate):** `app/(main)/budgets/page.tsx`,
  `app/(main)/team/page.tsx`, and `CashPositionCard` inline literal keys
  (`["budgetStatus", monthStart]`, `["users", page]`, `["cashPosition", startDate, endDate]`).
  If you touch these, migrate them to `queryKeys`.
- Namespaces available: `auth, products, customers, vendors, orders, expenses,
  discounts, promoCodes, users, reports, pos, budget, storeCredit, reconciliation`.

## Contexts (client state)

Only a handful of contexts exist; prefer them over introducing new global state:

| Context | File | Purpose |
|---|---|---|
| `useAuth()` | `lib/auth/AuthContext.tsx` | User, token, login, logout |
| `useSidebar()` | `contexts/SidebarContext.tsx` | Desktop expand vs mobile drawer; body scroll lock |
| `useDateRange()` | `lib/filters/DateRangeContext.tsx` | URL-driven `?start=&end=` report range |
| `useTranslation()` | `react-i18next` | Arabic strings |

Provider order in root layout: `QueryProvider → I18nProvider → Providers(Auth) →
KeepAliveProvider`. In `(main)`: `DateRangeProvider → AuthGate → SidebarProvider`.

## Local component state

- Forms: plain `useState` per field (uncontrolled-to-controlled). No form library.
- Lists/pagination: URL search params (server-ish state) as source of truth.
- Heavy derived data: derive during render (`useMemo`), never in `useEffect`.
- POS cart (`features/pos/hooks.ts`): central `useCart` + `usePosProducts`, with
  request sequencing to avoid stale invalidation. If you modify cart behavior, read
  `POS_CART_BUGS_PROMPT.md` at the repo root for known bug notes first.

## Rules of thumb

- Server data → React Query. Client ephemeral → local state. Cross-cutting app
  state → one of the existing contexts.
- On mutation success, invalidate the narrowest relevant key range, e.g.
  `queryClient.invalidateQueries({ queryKey: queryKeys.products.all })`.
- Use functional `setState` updates when state depends on the previous value.
- Don't sync server data into `useState`/`useEffect` — let React Query own it.
- Wrap non-urgent, expensive state updates in `startTransition`/`useDeferredValue`
  (see the `vercel-react-best-practices` skill for re-render rules).