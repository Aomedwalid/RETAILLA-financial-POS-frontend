# API Integration Patterns

> Binding rules for talking to the FastAPI backend. Read this before writing any
> data-fetching or mutation code.

## The response envelope

The backend wraps **every** response as:

```json
{ "status": 200, "message": "ok", "data": { ... } }
```

`lib/api.ts` `request<T>()` returns `res.data.data` — so feature code receives
**only the `data` payload** as `T`. Never double-unwrap.

**Exception:** raw `http` usage (only needed for multipart uploads) must unwrap
manually: `res.data?.data`. See `features/vendors/api.ts` (receipt upload) and
`lib/axios.ts` `attemptRefresh()`.

## Always go through `api.*`

`lib/api.ts` exports:

```ts
api.get<T>(endpoint, params?)
api.post<T>(endpoint, body?)
api.put<T>(endpoint, body?)
api.patch<T>(endpoint, body?)
api.delete<T>(endpoint)
```

Rules:

- Endpoints are absolute paths starting with `/api/...` (relative to the axios base
  URL, not Next's `/api`).
- Params are snake_case matching the FastAPI query params (`sort_by`, `month_start`,
  `date_tolerance_days`, ...).
- `request()` strips `null`/`undefined`/`""` from params automatically via
  `cleanParams`. You may pass optional params as-is.
- Methods return `Promise<T>` (already unwrapped). Throw `ApiError` on failure.

## Error handling

- Errors surface as `ApiError` with `status`, `message`, `errorCode`, `details`,
  and `validationErrors` (when `details` is an array of `{field, message}`).
- Network failures become `ApiError(0, "Network error")`.
- Display pattern (forms): catch the error; if `err instanceof ApiError`, show
  `err.message`; else fall back to `t("common.somethingWentWrong")`.
- The register page uses `err.validationErrors` to render field-level messages.

## Auth header, refresh, 401 retry (do not reinvent)

- `lib/axios.ts` attaches `Authorization: Bearer <token>` in a request interceptor.
- A response interceptor on 401 (with a token, not already retried) performs a
  single-flight `POST /api/auth/refresh` and retries the original request once.
  If refresh fails, it invokes the unauthorized handler (clears session → login).
- **Agent rule:** never call `/api/auth/refresh` yourself in feature code. Rely on
  the interceptor. Only `AuthContext` handles login/logout/refresh-on-load.

## Pagination

Paginated endpoints return:

```ts
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
```

- Page state is mirrored in URL search params on most list pages
  (`products`, `customers`, `money`, `users`). POS internal lists and store-credit
  keep page state local.
- Use `placeholderData: keepPreviousData` when paginating/filtering (see
  `app/(main)/money/page.tsx`) to avoid layout jumps.
- React Query config: queries `retry: 2`, `staleTime: 30_000`,
  `gcTime: 5 * 60 * 1000`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`;
  mutations `retry: 0`. Don't override per-query unless a real reason exists.

## Mock fallbacks

`features/budgets/api.ts` intentionally falls back to mock data on 404/400/network
errors (backend feature not live yet). This is a deliberate pattern for
not-yet-shipped endpoints — do not spread it to real endpoints. If you need a
similar fallback, mirror the shape of the real response and keep the fallback in
the feature's `api.ts`, not in components.

## Excel exports

Use `lib/excel.ts`:

```ts
import { ExcelColumn, buildWorkbook, buildFileName, downloadBlob } from "@/lib/excel";

const columns: ExcelColumn<Row>[] = [{ header: t("..."), value: (r) => r.field, type: "currency" }];
const wb = buildWorkbook(columns, rows, "Sheet");
downloadBlob(wb, buildFileName(t("file.prefix")));
```

- Arabic-aware column widths are handled automatically by `buildWorkbook`.
- File names follow `Name_YYYY-MM-DD.xlsx`.
- Reuse for every export; do not hand-roll xlsx code.

## Common mistakes

- ❌ Calling `http` directly for JSON endpoints.
- ❌ Unwrapping `.data` twice (feature `api.ts` returns the unwrapped value).
- ❌ Hard-coding the API base URL anywhere (use `NEXT_PUBLIC_API_URL`).
- ❌ Adding `keep-alive`/refresh logic outside the existing infra.
