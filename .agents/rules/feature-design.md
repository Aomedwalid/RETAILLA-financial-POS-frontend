# Feature Design Rules

> Binding rules for building and evolving feature modules in `retaila-dashboard`.

## The feature module contract

Every feature lives in `features/<name>/` and may include `types.ts`, `api.ts`,
`hooks.ts`, `validation.ts`, and `components/`. Follow `context/frontend-architecture.md`
for the exact responsibilities. Here we pin the "how":

### types.ts
- Define API payloads/interfaces and `PaginatedResponse<T>` for the feature.
- Keep field names snake_case to match the backend (the wrapper does not convert).
- Re-declaring `PaginatedResponse<T>` per feature is the current convention — but
  prefer importing from `lib/api.ts` where practical to reduce drift.

### api.ts
- `export const <name>Api = { ... }` — thin wrappers over `api.{get,post,put,patch,delete}`.
- Endpoints are absolute `/api/...` paths.
- Optional params typed `Record<string, string | number | boolean | null | undefined>`.
- Local `handleError(err)` guard pattern (used by customers, pos, discounts, users)
  is fine for normalizing errors before rethrow.
- Only import raw `http` for `multipart/form-data` (see `features/vendors/api.ts`).

### hooks.ts
- One hook per API method: `useXList(params)`, `useXDetail(id)`, `useCreateX`,
  `useUpdateX`, `useDeleteX`.
- Query keys via `queryKeys.<feature>.*`.
- Mutations: on success `queryClient.invalidateQueries({ queryKey: ... })` the
  narrowest relevant range.
- Use `keepPreviousData` for list/pagination queries to avoid flicker.

### validation.ts
- Pure functions `(data, t) => ValidationErrors`. See `rules/forms-validation.md`.

### components/
- Modals, tables, forms, cards, badges specific to the feature.
- Register heavy modals/slide-overs in `lib/lazy-modals.ts`; pages import those.

## Adding a new feature (checklist)

1. Create `features/<name>/` with `types.ts` first.
2. Add API methods to the feature `api.ts` (or to `lib/api.ts` for cross-cutting
   reports). Keep the wrapper thin.
3. Add `queryKeys.<name>` in `lib/query-keys.ts`.
4. Add hooks in `hooks.ts`.
5. Add validators in `validation.ts` if forms exist.
6. Build components, register lazy modals.
7. Create the page under `app/(main)/<name>/page.tsx` and register translation keys
   in `lib/i18n/locales/ar.json`.
8. Add `loading.tsx`/`error.tsx` if the route group needs them.

## Special features & their gotchas

- **POS** (`features/pos/hooks.ts`): central cart + products hooks with request
  sequencing to avoid stale invalidation. Read `POS_CART_BUGS_PROMPT.md` (repo
  root) before touching cart behavior.
- **Budgets** (`features/budgets/api.ts`): intentionally falls back to mock data
  on 404/400/network errors until the backend endpoint is live. Keep fallbacks in
  feature `api.ts`, not in components.
- **Reconciliation**: API + types already exist (`reconciliationApi` in `lib/api.ts`,
  `features/reconciliation/types.ts`) but the page is a placeholder. Reuse the API;
  don't redefine it.
- **Vendors** (`features/vendors/`): includes a receipt OCR-ingestion flow
  (upload → review lines → confirm) that posts `multipart/form-data` via raw `http`.
  Preserve the flow if you touch it.

## Cross-cutting rules

- No feature imports from another feature's internals. Lift shared UI to
  `components/` or compose at the page.
- Money is handled as strings in most report types (`"amount": "123.45"`) — format
  with `lib/format.ts`, don't assume `number`.
- Keep list state URL-synced where the existing pages do (products, customers,
  money, users); keep local where POS/store-credit do.
