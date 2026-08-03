# Routing Conventions

> Binding rules for the Next.js App Router structure in `retaila-dashboard`.

## Route groups

```
app/
  layout.tsx            Root layout: html[dir=rtl lang=ar class=dark], providers, fonts
  page.tsx              Server: redirect("/dashboard")
  not-found.tsx         Arabic 404
  (auth)/
    layout.tsx          Public shell; redirects to /dashboard if already authed
    login/page.tsx
    register/page.tsx
    loading.tsx  error.tsx
  (main)/
    layout.tsx          AuthGate + DateRangeProvider + SidebarProvider + AppShell
    loading.tsx  error.tsx
    dashboard/page.tsx
    pos/page.tsx
    products/page.tsx        (+ products/new/page.tsx)
    customers/page.tsx
    discounts/page.tsx
    money/page.tsx
    budgets/page.tsx
    expenses/page.tsx
    store-credit/page.tsx    (+ store-credit/[customerId]/page.tsx)
    vendors/page.tsx
    team/page.tsx
    reconciliation/page.tsx  (server, placeholder "coming soon")
    settings/page.tsx        (server, placeholder "coming soon")
```

## Page role rules

- **Server components** (no `"use client"`): only layout, page redirect, not-found,
  and the two placeholder pages (`reconciliation`, `settings`).
- **Client components** (`"use client"` at top): all data-driven dashboard pages.
  Wrap pages that read `useSearchParams`/use effect + navigation in a parent
  `<Suspense>` (required by Next; `(main)/layout.tsx` already wraps pages in Suspense).

## URL-driven state

Follow the established convention of mirroring list state in URL search params:

- `products`, `customers`, `money`, `users`: `?page=&size=&search=&sort_by=&sort_order=&filter=...`
- **Date range**: every report page uses `useDateRange()` which owns
  `?start=&end=` (YYYY-MM-DD). See `context/frontend-architecture.md` and
  `lib/filters/DateRangeContext.tsx`. `DateRangePopover` is the picker.

This makes pages shareable/bookmarkable and keeps React Query keys in sync.

## Layout & boundaries

- Every route group has `loading.tsx` (skeleton) and `error.tsx` (error boundary
  with reset). Preserve these when adding new segments.
- The root `<html>` is RTL + dark, set once. Do not create competing layouts that
  flip direction.

## New route checklist

1. Determine group: `(main)` if authenticated, `(auth)` if public.
2. Client page as needed, with a parent `<Suspense>` if it reads search params.
3. If it's a report page, wire `useDateRange()`.
4. Compose feature components; keep fetch logic in the feature's `api.ts`/`hooks.ts`.
5. Add `loading.tsx` and `error.tsx` if the route group lacks them.
6. Register any heavy new modal/card in the lazy registries
   (`lib/lazy-modals.ts`, `lib/lazy-dynamic.tsx`).