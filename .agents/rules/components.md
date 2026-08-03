# Component Guidelines

> Binding rules for writing React components in `retaila-dashboard`. Combine with
> the `vercel-react-best-practices`, `responsive-design`, and `accessibility`
> skills.

## File organization

- Shared primitives → `components/ui/` (currently: `Toast.tsx`).
- Cross-cutting shell → `components/` (`AppShell`, `Sidebar`, `TopBar`, `Providers`,
  `KeepAliveProvider`).
- Feature UI → `features/<name>/components/`.
- Heavy UI → registered in `lib/lazy-modals.ts` (modals/slide-overs/panels) or
  `lib/lazy-dynamic.tsx` (dashboard cards); pages import the registry entry.

## Naming

- Files: PascalCase for components (`CustomerForm.tsx`), camelCase for hooks/libs.
- Components named after what they render; props typed inline or via interfaces in
  the component file (types shared across a feature belong in `features/<name>/types.ts`).
- Hooks: `useXxx`. Query hooks live in `features/<name>/hooks.ts`.

## Client vs server

- Default everything to `"use client"` in this app (it is a client-rendered SPA).
- Keep pages/layouts that do pure composition as server components when possible.
- Heavy third-party/chart UI → `next/dynamic` with `ssr: false` + skeleton.

## Performance rules (project-pinned, from the Vercel skill)

- **Never define components inside components** (remount bug).
- **No inline barrels** — import direct paths.
- Prefer `useMemo`/`memo` only for expensive work; don't memo simple primitives.
- Derive state during render, not in effects (`You might not need an effect`).
- Use functional `setState` to avoid stale closures.
- Use `useDeferredValue`/`startTransition` for expensive derived renders.
- `next/dynamic` for anything heavy; preload on hover/focus for likely-next actions.
- Animate a wrapping `div`, not the SVG directly.

## Accessibility (from the `accessibility` skill — project notes)

- Native elements first: `<button>`, `<a href>`, real `<input>/<label>`.
- Modal/slide-over overlays: keep an accessible name, trap focus or use
  `aria-modal`, close on backdrop click + Escape.
- Icon-only buttons: `aria-label` (e.g. close buttons in modals).
- Badges/charts convey meaning via text too — never color alone.
- Table headers use `<th scope="col">`; row hover must not be the only selection cue.
- Form errors: `aria-invalid` + associated message; focus first error on submit.
- RTL: logical properties keep keyboard/AT order consistent.

## Responsive (from the `responsive-design` skill — project notes)

- Breakpoints in use: mobile drawer below `lg` (1024px) via
  `useMediaQuery("(min-width: 1024px)")` in `SidebarContext`.
- Modals: `w-[95vw] md:w-full max-w-*`; slide-overs `w-[95vw] max-w-[450px]`.
- Tables scroll horizontally on small screens (`overflow-x-auto`).
- Dashboard uses a 12-col responsive grid (`grid-cols-12`).
- Buttons/footers stack on mobile: `flex-col-reverse sm:flex-row`.

## Props & typing

- `strict: true` is on. Avoid `any`; prefer precise unions (`match_status` is a
  union, roles are `"ADMIN" | "CASHIER"`, etc.).
- Optional props that are non-primitive default values: hoist to a module constant
  to keep `memo()` working.
- Use `type` imports (`import type { ... }`) for type-only imports.

## Do/Don't

- ✅ Register new heavy components in lazy registries.
- ✅ Use `useAuth()`, `useDateRange()`, `useSidebar()`, `useTranslation()`.
- ✅ Read existing components (e.g. `CustomerForm`) before writing a new form.
- ❌ Duplicate the modal/table/badge markup patterns — copy the established classes.
- ❌ Introduce new global providers without a strong reason; compose at pages.
