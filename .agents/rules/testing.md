# Testing Rules

> Current status and conventions for automated tests in `retaila-dashboard`.

## Status: no test suite exists

- No `*.test.*` / `*.spec.*` / `__tests__` files.
- No jest/vitest/playwright config; no test script in `package.json`.
- The `webapp-testing` skill (installed) provides Playwright-based browser testing
  tooling you can use **ad-hoc** to verify UI behavior (screenshots, DOM checks,
  console logs) without adding a permanent harness.

## What to verify when you change code

Until a harness is added, verify changes with the same rigor the repo uses today:

1. **Type-check:** `npx tsc --noEmit` (or rely on the Next build).
2. **Lint:** `npm run lint` (Next ESLint flat config, `eslint-config-next/core-web-vitals`).
3. **Production build:** `npm run build` — catches hydration, missing Suspense
   around `useSearchParams`, invalid imports, and bundle regressions.
4. **Manual/dev smoke:** run `npm run dev`, exercise the affected flows, watch the
   browser console and `dev-err.log` for errors.
5. **Ad-hoc browser checks:** use the `webapp-testing` skill's Playwright scripts
   (server lifecycle via `scripts/with_server.py`, wait for `networkidle` before
   inspecting DOM).

## If you add a test harness (future work)

Follow the ecosystem that fits this stack, and keep it project-consistent:

- **Unit/component:** Vitest + React Testing Library + `@testing-library/jest-dom`.
  Test validators in `features/*/validation.ts` first (pure functions, ideal units).
- **E2E:** Playwright against the dev server. Cover: login → dashboard, POS cart
  add/checkout, product create, URL-param pagination.
- Add `test` script to `package.json` and wire into CI.
- Keep tests French-free/Arabic-aware: assert on translation keys or stable
  `data-testid`s, not raw Arabic text (text lives in `lib/i18n/locales/ar.json`).

## Golden rules

- Never commit a change that breaks `npm run lint` or the production build.
- If you add logic, add/extend the matching validator test once a harness exists.
- The `webapp-testing` skill is the sanctioned way to do browser-level verification
  without committing test files.