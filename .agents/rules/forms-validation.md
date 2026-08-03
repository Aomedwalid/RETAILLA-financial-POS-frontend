# Forms & Validation

> Binding rules for forms in `retaila-dashboard`. The project uses hand-rolled
> validation (no zod/form library in app code).

## Validation style

- Validators are **pure functions** in `features/<name>/validation.ts`:
  ```ts
  type ValidationErrors = Record<string, string>;
  function validateProductForm(data: ProductFormData, t: TFunction): ValidationErrors;
  ```
- They take the i18next `t` function so error messages are **localized** (keys
  like `validation.productNameRequired` in `lib/i18n/locales/ar.json`).
- Return an empty object when valid; otherwise `{ [fieldName]: message }`.
- Keep signatures consistent: `(data, t) => ValidationErrors` or
  `(value, t) => string | null` for single-field validators.

## Existing validators (reuse before writing new)

- `features/products/validation.ts`
  - `validateProductForm(data, t)` — required name, positive price, cost ≤ price,
    ≤ 100 variants, consistent attribute keys across variants, duplicate-variant
    detection (normalized signature).
  - `validateStockAdjustment(quantity, t)`.
- `features/customers/validation.ts`
  - `normalizePhone` — Egyptian `+20`/`20` → `0`.
  - `validatePhone` — 11 digits, prefixes `010|011|012|015`.
  - `validateCustomerForm(data, t)`, `validateDebtAmount`, `validatePoints(points, available)`.
- Password (register page, not a shared module): min 9 chars + letter + digit;
  strength meter via `lib/auth/passwordStrength.ts`.

## Form component pattern (copy `CustomerForm.tsx` / `ProductForm.tsx`)

1. Local `useState` per field.
2. On submit: run validator → if errors, `setFieldErrors(errors)` and abort.
3. Build payload → call the feature `api` object (or a `useMutation` hook).
4. Success → `onSaved()` closes modal; parent invalidates/refetches.
5. Failure → set a top-level `serverError` banner:
   `err instanceof ApiError ? err.message : t("common.somethingWentWrong")`.
6. Live field validation: validate on change once "touched" (e.g. phone fields).

## Server-side validation errors

- `ApiError.validationErrors` (populated when the backend returns an array in
  `details`) carries `{ field, message }[]`. The register page renders these as
  field-level messages. Wire this in new forms when the backend provides it.

## Rules

- Always validate client-side with the feature validator AND handle `ApiError`
  from the server. Client validation is UX; server validation is truth.
- Don't introduce zod or a form library for new forms — stay consistent.
- If a validator needs a new translation key, add it to `lib/i18n/locales/ar.json`
  under `validation.*`.
- Error UI: `border-error` on the input + inline message below; submitting spinner
  icon `progress_activity animate-spin` on the submit button.
