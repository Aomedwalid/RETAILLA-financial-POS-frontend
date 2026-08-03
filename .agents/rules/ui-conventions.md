# UI Conventions

> Binding styling and component conventions. Follow the `responsive-design` skill
> for layouts; this file pins this project's design system.

## Design system: Material Design 3 dark theme (Tailwind 4)

Tokens are defined in `app/globals.css` via `@theme inline`. **Use tokens, not raw
hex values.**

Key color tokens:
- `surface-dim`, `surface-container-low/lowest/high/highest`
- `primary` (#acc7ff), `primary-container`, `on-primary`, `on-primary-container`
- `secondary` (#49dfa2)
- `error`, `outline`, `outline-variant`, `on-surface`, `on-surface-variant`, `tertiary`

Typography tokens (used as Tailwind classes):
- `font-headline-sm/md`, `font-display-lg`, `font-label-caps`
- `font-data-table` (IBM Plex Mono — use for numbers/amounts)
- `font-body-md/lg`
- Sizes: `text-headline-sm`, `text-label-caps`, `text-body-md`, etc.

Spacing tokens: `p-card-padding` (20px), `stack-md/lg/sm`, `gutter` (16px),
`container-margin` (24px), `unit`.

Global helpers in `globals.css`: `.glass-card`, `.custom-scrollbar`, `.hide-scroll`,
`.material-symbols-outlined`, keyframes + `.animate-fade-in`, `.animate-scale-in`,
`.animate-slide-in-right/left`.

## RTL (non-negotiable)

- App is **right-to-left** (`dir="rtl"`, `html { direction: rtl }`).
- Use **logical CSS properties** in Tailwind: `start-*`, `end-*`, `ps-*`, `pe-*`,
  `ms-*`, `me-*`, `border-s-*`, `text-start`, `text-end`, `right/left` only when a
  fixed side is required (e.g. slide-overs pinned to `right-0`).
- Use the `rtl:` custom variant when you need direction-specific overrides.
- Numbers/dates are formatted `ar-EG` (Eastern Arabic numerals) via `lib/format.ts`.

## Icons: Material Symbols font

- Icons are inline spans, NOT lucide-react:
  ```tsx
  <span className="material-symbols-outlined">inventory_2</span>
  ```
- The font is loaded in `app/layout.tsx` with `fontVariationSettings` for
  filled/unfilled styles.
- Use a semantic icon name from the Material Symbols catalog; match the app's
  existing vocabulary (e.g. `storefront`, `inventory_2`, `group`, `request_quote`).

## Core component patterns (copy these)

### Card
```tsx
<div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
```

### Centered modal
`fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in` →
backdrop `absolute inset-0 bg-black/80 backdrop-blur-sm` (click closes) →
panel `relative w-[95vw] md:w-full max-w-{md|lg|2xl} bg-surface-container-high
rounded-2xl border border-outline-variant shadow-2xl animate-scale-in
max-h-[90vh] flex flex-col` + `onClick={(e) => e.stopPropagation()}`.
Header: `p-4 md:p-6 border-b` with close button `w-8 h-8 rounded-full`.
Body: scrollable. Footer: `flex-col-reverse sm:flex-row justify-end gap-3`.

### Slide-over panel
`fixed inset-0 z-[110]` + `absolute right-0 top-0 bottom-0 w-[95vw] max-w-[450px]`.
Mobile POS cart drawer uses the left edge with `-translate-x-full`.

### Table
- Wrapper: `bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden overflow-x-auto`.
- `table.w-full border-collapse`; `thead` = `bg-surface-container-high/50 border-b border-outline-variant`,
  `th` = `font-label-caps text-label-caps text-outline px-card-padding py-4`.
- `tbody` = `divide-y divide-outline-variant`; hover row `hover:bg-surface-variant/10`
  + inset shadow indicator (`inset 4px 0 0 #acc7ff`).
- Empty state row: big Material icon + message.
- Skeleton rows: `animate-pulse` blocks.
- Footer: pagination bar.

### Badge
`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border`
with semantic combos `bg-X/10 border-X/20 text-X` (secondary/primary/error/tertiary).

### Buttons
- Primary: `bg-primary text-on-primary font-bold rounded-lg/xl px-6 py-2.5 hover:brightness-110 active:scale-95 transition-all`
- Ghost/secondary: `border border-outline-variant text-on-surface hover:bg-surface-variant/20`

### Tabs
- Underline: `relative pb-4 font-label-caps`, active `text-primary` + `absolute bottom-0 h-0.5 bg-primary`.
- Pill: active `bg-primary-container text-on-primary-container`.

### Forms & inputs
- Label: `font-label-caps text-[10px] text-outline mb-1 block`.
- Input: `bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary`.
- Error: `border-error` + inline message; submitting state shows
  `progress_activity` icon with `animate-spin`.

### Loading skeletons
Inline `animate-pulse` blocks everywhere; `DashboardCardSkeleton` and
`AppShellSkeleton` for the shell/dashboard.

### Toast
`components/ui/Toast.tsx` — fixed top-right, auto-dismiss (4s), success/error.
Do not create new toast implementations (a stale `features/discounts/components/Toast.tsx`
exists; don't copy it).

## Consistency rules

- All user-facing strings go through `t("...")` — never hardcode Arabic (or any)
  text in components. Keys live in `lib/i18n/locales/ar.json` (flat dotted keys).
- Dark-only. No light mode, no theme toggle.
- Numbers/currency/dates: use `lib/format.ts` (ar-EG).
- New shared UI primitives go in `components/ui/`; feature-specific UI stays in the
  feature's `components/`.
