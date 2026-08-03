# Common Pitfalls

> The most common mistakes agents make in this repo, and how to avoid them.
> Consult this before/while writing code.

## 1. Double-unwrapping the API envelope

Backend returns `{ status, message, data }`. `lib/api.ts` already unwraps `.data`.
- ❌ `res.data.data` in feature code — you'll get `undefined`.
- ✅ Let `api.get<T>` return `T` directly.
- ⚠️ Only raw `http` calls (multipart uploads, refresh) unwrap manually.

## 2. Inline query keys instead of `queryKeys`

- ❌ `useQuery({ queryKey: ["budgetStatus", monthStart] })` — known offenders:
  `budgets/page.tsx`, `team/page.tsx`, `CashPositionCard`.
- ✅ Use `queryKeys.<namespace>.<factory>(...)` from `lib/query-keys.ts`. Migrate
  old inline keys when you touch those files.

## 3. Direct `http` usage for JSON

- ❌ `import http from "@/lib/axios"` for regular endpoints.
- ✅ Use the feature `api.ts` object → `api.get/post/...`.
- ✅ Only `multipart/form-data` (vendor receipt upload) imports raw `http`.

## 4. Hardcoded Arabic/UI strings

- ❌ `"حفظ"` or `"Save"` inside a component.
- ✅ `t("common.save")` with the key added to `lib/i18n/locales/ar.json`.

## 5. Money as `number` where API returns strings

- Report payloads are `string` money (`"total_sales": "123.50"`).
- ❌ `Number(total_sales).toFixed(2)` inline with mixed locale.
- ✅ `formatCurrency(...)` from `lib/format.ts`.

## 6. Breaking RTL / logical properties

- ❌ `left-4`, `mr-2`, `text-left` for generic layout (breaks RTL).
- ✅ `start-4`, `me-2`, `text-start`, `border-s-*`, `ps-*`.
- ⚠️ Fixed sides are OK for pinned elements: slide-overs `right-0`.

## 7. Components defined inside components (remount bug)

- ❌ Nested `const Row = () => ...` inside a render.
- ✅ Extract to module-level components; pass props.

## 8. Forgetting the lazy-loading registries

- ❌ Importing a heavy modal/card directly into a page bundle.
- ✅ Register in `lib/lazy-modals.ts` (modals/panels) or `lib/lazy-dynamic.tsx`
  (dashboard cards), import the registry entry.

## 9. Using lucide-react icons

- The project uses the **Material Symbols font**, not lucide-react.
- ✅ `<span className="material-symbols-outlined">inventory_2</span>`.

## 10. New report pages that don't use `useDateRange()`

- ❌ Hard-coded or local date state on report pages.
- ✅ `const { startDate, endDate } = useDateRange();` + `DateRangePopover`.
  (URL params `?start=&end=`.)

## 11. Adding global providers/state

- ❌ New React Context for something a feature hook can handle.
- ✅ React Query for server state; existing contexts (`useAuth`, `useSidebar`,
  `useDateRange`, `useTranslation`) for cross-cutting state.

## 12. Breaking the keep-alive

- The backend is a free Render host that sleeps. `KeepAliveProvider` +
  axios interceptor (`recordActivity`) keep it warm.
- ❌ Removing the interceptor call or the provider.
- ❌ Adding another home-grown pinger.

## 13. Adding a token store

- ❌ Putting the access token in localStorage/sessionStorage/cookies.
- ✅ It lives in the module variable in `lib/axios.ts`; refresh is cookie-based.

## 14. Validation without `t`

- ❌ `validateProductForm(data)` returning hardcoded Arabic messages.
- ✅ `(data, t) => ValidationErrors` using `t("validation.*")`.

## 15. Breaking the response envelope assumptions in mutations

- Mutations return unwrapped `data` too. Check the `ApiError` for `message`,
  `errorCode`, and `validationErrors` (when `details` is an array).

## 16. Skipping `loading`/`error` boundaries

- Every route group has `loading.tsx` + `error.tsx`. Don't delete them; add for new
  segments. Client pages reading search params need a parent `<Suspense>`.

## 17. Mock fallback misuse

- The budgets feature intentionally falls back to mock data (endpoint not live).
  ❌ Copying this pattern to real endpoints.
  ✅ Keep any needed fallback inside the feature `api.ts`, never in components.

## 18. Doc drift

- After changing architecture/conventions, update the `.agents/` doc + `AGENTS.md`
  in the same change, or agents will follow stale rules.