# Performance Rules

> Project-pinned performance conventions. The `vercel-react-best-practices` skill
> is the full reference (70 rules, 8 categories); this file maps them onto this
> codebase.

## Priority order (highest impact first)

1. **Eliminate waterfalls** — `Promise.all` independent fetches; start promises
   early, await late. In React Query, parallel `useQuery` calls already run
   concurrently — don't serialize with `await` inside a single hook.
2. **Bundle size** — direct imports, `next/dynamic` for heavy UI, keep static
   import paths literal.
3. **Server-side** — this app is client-rendered; applies mainly if you add RSC,
   Server Actions, or API routes: authenticate inside, avoid module-level mutable
   request state, use `React.cache()`/LRU for dedup, hoist static I/O.
4. **Re-renders** — memoize only expensive work; derive during render.
5. **Rendering/JS micro-optimizations** — as needed on hot paths.

## Project-specific rules

### Bundle & lazy loading
- **Use the lazy registries.** New modals/slide-overs → `lib/lazy-modals.ts`
  (`next/dynamic`, `ssr: false`). New dashboard report cards →
  `lib/lazy-dynamic.tsx` with a skeleton. Never import heavy components directly
  into a page.
- Import **direct paths**, avoid barrel `index.ts` re-export files.
- Keep `next/dynamic` import strings literal (statically analyzable) — don't build
  dynamic paths from variables.

### Data fetching
- React Query already dedups and caches. Don't hand-roll fetch effects.
- `placeholderData: keepPreviousData` for paginated lists (see `money/page.tsx`).
- Don't over-fetch: pass only needed params; the wrapper strips empties anyway.
- For search inputs, debounce (~300ms, as in `products/page.tsx`).

### Re-renders
- ❌ No components defined inside components.
- ❌ No `useMemo`/`useCallback` for trivial primitives.
- ✅ Functional `setState` updates; derive values during render, not in effects.
- ✅ `useDeferredValue`/`startTransition` for expensive derived lists (search/filter).
- ✅ Lazy `useState(() => expensiveInit())` for anything heavy from storage/DOM.
- ✅ Narrow effect dependency arrays to primitives.

### Rendering
- Animate a wrapper `div`, not the SVG element.
- Prefer ternary `? :` over `&&` when a falsy `0`/`NaN` could render.
- Tables are already horizontally scrollable; avoid rendering hundreds of DOM rows
  when a paginated slice exists.

## Known current hotspots (do not regress)

- **Dashboard** renders 12 report cards — all lazy-loaded with skeletons. Keep the
  lazy pattern when adding a 13th.
- **POS product grid** — ensure search/sort stay responsive
  (`useDeferredValue` if you touch it).
- **Keep-alive** (`lib/keep-alive.ts`) pings every 2 min of inactivity only when
  visible+online; the axios interceptor records activity. Keep this cheap.

## Measurement

- Run `npm run build` to verify no page bundles balloon.
- No bundle analyzer is configured; use `next build` output sizes as the guard.