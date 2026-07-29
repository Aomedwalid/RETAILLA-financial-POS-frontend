# POS Cart Bugs — Full Fix Prompt

We have several bugs in the POS cart feature (`features/pos/hooks.ts`, `features/pos/components/CartItem.tsx`, `features/pos/components/CartPanel.tsx`, `features/pos/types.ts`). Fix them in this order, and verify `tsc --noEmit` passes after each one.

---

## 1. Fix displayTotal in CartItem.tsx (promo double-multiplication bug)

Replace:

```typescript
const displayTotal = (parseFloat(item.effective_price ?? item.unit_price) * localQty).toFixed(2);
```

with:

```typescript
const displayTotal = localQty === item.quantity
  ? item.line_total
  : (item.quantity > 0
      ? ((parseFloat(item.line_total) / item.quantity) * localQty).toFixed(2)
      : "0.00");
```

`line_total` is already the correct backend-derived total per line — don't recompute it from a derived per-unit price. The scaled branch is only a temporary visual estimate while a quantity change is in flight; once the debounced update resolves, `item.line_total` and `item.quantity` update together and this reverts to the direct case.

---

## 2. Remove effective_price entirely

Delete it from `CartItem` in `types.ts`, and stop setting it in `populateItemsFromCart` in `hooks.ts`. It's no longer used anywhere. `line_total` is the single source of truth for a cart item's total.

---

## 3. Fix clearCart to stay consistent with cart state

Replace:

```typescript
const clearCart = useCallback(async () => {
  for (const item of items) {
    await posApi.removeCartItem(item.variant_id);
  }
  setItems([]);
  const result = await posApi.getCart();
  setCart(result);
}, [items]);
```

with a version that:

- Wraps the removal loop in try/catch and rethrows so `page.tsx`'s `handleClearCart` can surface an error to the user instead of failing silently.
- Calls `populateItemsFromCart(result)` at the end instead of manually setting `setItems([])`, so `cart` and `items` never disagree (e.g. if removing all items has server-side side effects like clearing an expired promo).
- Optionally batches removals with `Promise.all` instead of sequential awaits, if the backend endpoint is safe to call concurrently — otherwise leave sequential but keep the try/catch.

---

## 4. Remove the unused info parameter from addItem

`addItem(variantId, qty, info)` in `hooks.ts` accepts a fully-typed `info` object (`product_name`, `sku`, `attributes`, etc.) that's never used — `populateItemsFromCart` re-fetches product data independently. Either:

- Remove the `info` param from `addItem` and its call sites in `page.tsx`, **or**
- If the intent was to avoid the extra product fetch, actually use `info` to build the `CartItem` directly instead of calling `productsApi.get()` again.

Pick whichever fits the intended design, but don't leave it unused — it's confusing and wastes a round trip.

---

## 5. Guard against out-of-order network responses in updateQuantity

Rapid successive quantity changes can result in an older request's response arriving after a newer one's, overwriting current state with stale data. Add a request-sequencing guard: a `useRef` counter incremented on each call to `updateQuantity`, capturing the id at call time, and only calling `setCart`/`populateItemsFromCart` if that id still matches the latest issued request when the response arrives. Apply the same pattern to `addItem`, `removeItem`, `applyPromo`, and `removePromo` if they can plausibly overlap.

---

## 6. Fix PricingSummary's defensive parsing

`hasProductDiscount`, `hasPromoDiscount`, and `totalDiscount` all call `parseFloat` on backend string fields without guarding against `null`/malformed values (unlike `formatCurrency` in the same file, which has an `isNaN` fallback). Add the same safe-parse pattern used in `formatCurrency` wherever `pricing.total_product_discount` / `pricing.total_promo_discount` are parsed directly.

---

## 7. Wire up the manual discount panel in CartPanel.tsx — this is the most important fix

Currently `discountEnabled`, `discountType`, `discountValue`, `discountReason`, and `computedDiscountAmount` are fully local UI state that visually changes "Total Due" but is **never sent to the backend** in `handleCheckout`:

```typescript
await onCheckout({
  cash_amount: cashAmount.toFixed(2),
  store_credit_amount: storeCreditAmount.toFixed(2),
  customer_id: customer?.id ?? undefined,
});
```

This means a cashier can apply a discount on screen that has **zero effect** on the actual charge — a silent undercharge/overcharge bug. Fix:

1. Extend `CheckoutPayload` in `types.ts` to include `manual_discount_type`, `manual_discount_value`, and `manual_discount_reason` (check the backend's actual checkout endpoint contract first — confirm field names match what the server expects; `Cart` already has `manual_discount_type`/`manual_discount_value`/`manual_discount_reason`/`manual_discount_approved_by` fields, suggesting the backend supports this).

2. Update `handleCheckout` in `CartPanel.tsx` to include these fields when `discountEnabled` is true.

3. Update `onCheckout`'s type signature in `CartPanel.tsx`'s props and its implementation in `page.tsx` (`handleCheckout`) to pass them through to `posApi.checkout(...)`.

4. After wiring this up, confirm server-side validation actually happens — don't just trust the client-computed `computedDiscountAmount`. If `TenantSettings` (already defined in `types.ts` but unused anywhere) is meant to drive discount limits/approval, check whether the backend enforces `max_discount_percent`, `max_discount_amount`, and `manager_approval_threshold` itself, since the frontend's own `DEFAULT_MAX_DISCOUNT_PCT`/`DEFAULT_MAX_DISCOUNT_AMOUNT` constants are just client-side guardrails a modified request could bypass.

5. Manually test: enable a discount, complete checkout, and confirm the actual charged/recorded amount in the order matches the discounted total, not the pre-discount total.

---

## Final verification checklist

- [ ] `tsc --noEmit` passes
- [ ] Apply a promo, confirm cart line total and subtotal agree, click +/- during the promo, confirm no doubling
- [ ] Clear cart, confirm no leftover items and no stale promo state
- [ ] Rapid-click quantity +/- several times, confirm final displayed quantity/total matches what the server actually has (check network tab for response order)
- [ ] Apply a manual discount, complete checkout, confirm the order total reflects the discount server-side, not just on screen
