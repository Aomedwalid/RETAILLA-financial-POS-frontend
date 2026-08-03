# Authentication Flow

> How auth works in `retaila-dashboard`. Read before touching login, register,
> logout, token handling, or route protection.

## Model: cookie-refresh with in-memory access token

- The **access token is held ONLY in a module-scope variable** in `lib/axios.ts`
  (`_accessToken`), set via `setAccessToken(token)` / read by the interceptor.
  It is **never** persisted to `localStorage` or a client cookie.
- The **refresh mechanism uses an httpOnly cookie** via `withCredentials: true`
  on the axios instance.
- The **user object** (`AuthUser`) IS persisted to `localStorage["currentUser"]`
  for optimistic UI on reload, then re-validated via refresh.

Flow on page load (in `AuthProvider`):
1. Optimistically load stored user from localStorage.
2. Call `authApi.refresh()` → `POST /api/auth/refresh` (cookie-based).
3. On success: set access token (+ update user if returned), persist user.
4. On failure: clear token, user, and storage.
5. `isLoading` flips false. The UI gates on this.

## AuthContext (`lib/auth/AuthContext.tsx`)

Exposes via `useAuth()`:

```ts
{
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login(email, password): Promise<void>;
  logout(): Promise<void>;
}
```

- `login` → `authApi.login` → sets token + user, persists user.
- `logout` → `authApi.logout()` (errors ignored), then clears everything.
- Registers an unauthorized handler with `setUnauthorizedHandler` so the axios
  401-refresh-failure path clears the session too.

## Actors and types

```ts
interface AuthUser {
  id: string; email: string; role: string; tenant_id: string;
  full_name?: string; permissions?: string[]; tenant_name?: string; avatar?: string;
}
interface LoginResponse { access_token: string; user: AuthUser; }
interface RefreshResponse { access_token: string; user?: AuthUser; }
```

Roles: `"ADMIN"` | `"CASHIER"` (see `app/(main)/team/page.tsx`). Some UI
(Inventory Overview tab) is admin-gated by checking `user.role`.

## Route protection (client-side)

There is **no `middleware.ts`** and **no server-side authorization**.

- `app/(auth)/layout.tsx` (public): if `accessToken` exists and not loading →
  `router.replace("/dashboard")`; otherwise render the login/register page.
- `app/(main)/layout.tsx` (`AuthGate`): if loading → `AppShellSkeleton`; if no
  token → `router.replace("/login")`. When authed, wraps children in
  `SidebarProvider` + `AppShell`.

**Agent rule:** if you add a page that must be authenticated, place it under the
`(main)` route group. If it must be public, place it under `(auth)`. Do not roll
your own guards.

## Registration

- Invite-token flow: `/register?token=...` → `authApi.registerWithToken` →
  redirect to `/login?registered=true` (login page shows a success banner).
- Client-side password rule (in the register page, not a shared validator):
  **min length 9, must contain a letter AND a digit**. Display a 5-segment strength
  meter from `getPasswordStrength()` in `lib/auth/passwordStrength.ts`.

## Security rules

- ❌ Never store the access token in `localStorage`, `sessionStorage`, or a cookie
  you control. It stays in the module variable.
- ❌ Never log tokens or secrets.
- The axios instance already sends `withCredentials: true`; keep it.
- If you add a Server Action or API route (currently none exist), you MUST
  authenticate and authorize inside it — do not rely only on a layout guard.

## Related docs

- API integration and the 401/refresh interceptor: `rules/api-integration.md`
- Password strength: `lib/auth/passwordStrength.ts`