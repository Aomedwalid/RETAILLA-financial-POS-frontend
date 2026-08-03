# Documentation & Localization

> Rules for writing docs and for the Arabic i18n system in this project.

## Documentation conventions

- Every doc lives under `.agents/` in the appropriate tree:
  - `.agents/context/` — architecture & overview (stable, broad).
  - `.agents/domains/` — business domain + glossary (concepts).
  - `.agents/rules/` — binding conventions for writing code.
- Root `AGENTS.md` is the mandatory entry point that links to all of it. **When you
  change an architecture/convention, update the relevant doc AND `AGENTS.md` so the
  two don't drift.**
- Write in English (the codebase/docs language). Arabic strings live only in the
  i18n resource file, never in docs/code.

## i18n system

- **Library:** i18next + react-i18next. Single locale `ar` only.
- **Config:** `lib/i18n/config.ts` — `lng: "ar"`, `fallbackLng: "ar"`,
  interpolation `escapeValue: false`.
- **Resource file:** `lib/i18n/locales/ar.json` (~1551 lines), flat dotted keys.
- **Usage:** `const { t } = useTranslation();` then `t("nav.dashboard")`.
- **Provider:** `I18nProvider` (`lib/i18n/I18nProvider.tsx`) is a passthrough that
  imports the config for side-effect init; it's mounted in the root layout.

### i18n rules (binding)
- ❌ Never hardcode user-facing strings (Arabic or otherwise) in components.
  All UI text goes through `t("...")`.
- Adding a new string → add a key under the right namespace in `ar.json` (e.g.
  `validation.*`, `common.*`, `nav.*`, `<feature>.*`).
- Use the existing flat dotted namespace; don't create a second key structure.
- Error messages from validators use `t("validation.*")`; server `ApiError.message`
  is shown as-is (backend provides the localized text).
- Formats: use `lib/format.ts` (`formatCurrency`, `formatDate`) which already
  target `ar-EG` (Eastern Arabic numerals, `ج.م`). Do not call `toLocaleString`
  with a different locale in components.

## Accessibility of content

- The app is `lang="ar" dir="rtl"` at the root. New UI must keep this.
- Translation keys are also used by test selectors when a test harness is added —
  keep keys stable.

## Keeping docs current

- Doc maintenance is part of every task: if a task changes naming, routing, an API
  shape, or a UI convention, update the doc that describes it in the same change.