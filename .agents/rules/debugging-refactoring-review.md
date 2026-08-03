# Debugging, Refactoring & Code Review

> Process rules for the human-facing workflow skills. The `systematic-debugging`,
> `clean-code`, and `code-review` skills are the operative procedures; this file
> pins how they apply to this repo.

## Debugging

Load the **`systematic-debugging`** skill first when encountering any bug, test
failure, or unexpected behavior. Project-specific reminders:

- **Reproduce before fixing.** Use `npm run dev` and the browser devtools. Watch
  the Network tab for the request/response envelope (`{ status, message, data }`)
  and the console for `ApiError` messages.
- **Log files exist at repo root:** `dev.log` and `dev-err.log` — check them.
- **POS cart bugs:** read `POS_CART_BUGS_PROMPT.md` (repo root) — it documents
  known POS cart issues. The cart uses request-sequencing in
  `features/pos/hooks.ts` to avoid stale invalidation; a common class of bug is
  stale cache after checkout/refund.
- **Stale data** usually means a mutation didn't invalidate the right `queryKeys`
  — verify invalidation before suspecting the backend.
- **Auth/session drops** — the token is memory-only; a failed refresh silently
  clears the session. Check the refresh request and the unauthorized handler.
- **Check root cause, not symptoms:** isolate to a component vs query vs API call
  before editing.

## Refactoring

Load the **`clean-code`** skill (and `request-refactor-plan` for large efforts).
Repo-specific rules:

- Preserve the feature-module contract (`types.ts` / `api.ts` / `hooks.ts` /
  `validation.ts` / `components/`).
- Keep validators pure and `(data, t)`-shaped; don't merge validation into
  components during refactors.
- Keep money formatting in `lib/format.ts`; don't inline `toLocaleString`.
- Don't convert RTL/`ar`/`dir=rtl` to LTR, and don't drop the lazy-registry pattern.
- Keep translations in `lib/i18n/locales/ar.json`; move hardcoded strings there.

## Code review

Load the **`code-review`** skill when reviewing a diff (it reviews along two axes:
Standards and Spec). Repo-specific standards sources:

- This knowledge base — `context/`, `rules/`, `domains/` under `.agents/`.
- The installed skills (each is a standards document for its domain).
- Root `AGENTS.md` (entry point).

Baseline smells to watch for in this codebase specifically:
- **Duplicate query keys** vs the `queryKeys` factory (known offenders exist —
  treat new inline keys as a violation).
- **Direct `http` usage** for JSON endpoints.
- **Raw Arabic strings** in components instead of `t(...)`.
- **Money handled as `number`** where the API returns strings.
- **Re-invented modal/table/badge markup** instead of copying established classes.
- **Components defined inside components** (remount bug) and **un-memoized heavy
  children**.

## The two axes apply like this

- **Standards axis:** against `.agents/rules/*` + skills + repo conventions.
- **Spec axis:** against the originating issue/PRD (there is no issue tracker in
  this repo — if no spec exists, the spec axis reports "no spec available").