"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { promoCodesApi } from "../api";
import { productsApi } from "@/features/products/api";
import type { PromoCode, PromoCodeCreate, PromoCodeUpdate, DiscountType } from "../types";

interface PromoCodeSlideOverProps {
  promoCode?: PromoCode | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

export default function PromoCodeSlideOver({
  promoCode,
  onClose,
  onSaved,
  onError,
}: PromoCodeSlideOverProps) {
  const [type, setType] = useState<DiscountType>(promoCode?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(promoCode ? String(promoCode.value) : "");
  const [maxDiscount, setMaxDiscount] = useState(
    promoCode?.max_discount_amount != null ? String(promoCode.max_discount_amount) : ""
  );
  const [appliesToAll, setAppliesToAll] = useState(
    promoCode?.applies_to_all_products ?? true
  );
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(promoCode?.applicable_product_ids ?? [])
  );
  const [expiresAt, setExpiresAt] = useState(
    promoCode?.expires_at ? promoCode.expires_at.slice(0, 10) : ""
  );
  const [active, setActive] = useState(promoCode?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (keyword: string) => {
    setProductsLoading(true);
    try {
      const result = await productsApi.search({ keyword, page: 1, size: 50 });
      setProducts(result.items.map((p) => ({ id: p.id, name: p.name })));
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appliesToAll) fetchProducts(productSearch);
  }, [appliesToAll, fetchProducts]);

  function handleProductSearch(val: string) {
    setProductSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(val), 300);
  }

  function toggleProduct(id: string) {
    const next = new Set(selectedProducts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProducts(next);
  }

  async function handleSubmit() {
    if (!value.trim()) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    if (type === "PERCENTAGE" && numValue > 100) return;
    if (!appliesToAll && selectedProducts.size === 0) return;

    const numMax = maxDiscount ? parseFloat(maxDiscount) : undefined;

    setSubmitting(true);
    try {
      if (promoCode) {
        const payload: PromoCodeUpdate = { active };
        if (type !== promoCode.type) payload.type = type;
        if (numValue !== promoCode.value) payload.value = numValue;
        if (numMax !== (promoCode.max_discount_amount ?? undefined)) payload.max_discount_amount = numMax;
        if (appliesToAll !== promoCode.applies_to_all_products) payload.applies_to_all_products = appliesToAll;
        if (!appliesToAll) payload.applicable_product_ids = Array.from(selectedProducts);
        else payload.applicable_product_ids = [];
        if (expiresAt) payload.expires_at = expiresAt + "T23:59:59Z";
        await promoCodesApi.update(promoCode.id, payload);
      } else {
        const payload: PromoCodeCreate = {
          type,
          value: numValue,
          applies_to_all_products: appliesToAll,
        };
        if (type === "PERCENTAGE" && numMax !== undefined) payload.max_discount_amount = numMax;
        if (!appliesToAll) payload.applicable_product_ids = Array.from(selectedProducts);
        if (expiresAt) payload.expires_at = expiresAt + "T23:59:59Z";
        await promoCodesApi.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to save promo code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-100 pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[95vw] max-w-[450px] bg-surface-container pointer-events-auto border-l border-outline-variant shadow-2xl">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {promoCode ? "Edit Promo Code" : "New Promo Code"}
            </h3>
            {promoCode && (
              <div className="flex items-center gap-2">
                <span className="font-data-table text-[13px] text-primary bg-surface-container-highest/50 px-2 py-1 rounded border border-outline-variant/50">
                  {promoCode.code}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {promoCode && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                <p className="text-xs text-on-surface-variant">
                  Code is auto-generated. It cannot be changed.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  DISCOUNT TYPE
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as DiscountType);
                    if (e.target.value === "PRICE") setMaxDiscount("");
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="PRICE">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  VALUE
                </label>
                <input
                  type="number"
                  step={type === "PERCENTAGE" ? "1" : "0.01"}
                  min="0"
                  max={type === "PERCENTAGE" ? "100" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "PERCENTAGE" ? "20" : "10.00"}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {type === "PERCENTAGE" && (
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  MAXIMUM DISCOUNT AMOUNT
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="Leave empty for no limit"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                APPLIES TO ALL PRODUCTS
              </label>
              <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
                <p className="text-sm text-on-surface-variant">
                  {appliesToAll
                    ? "This promo applies to every product in the store."
                    : "This promo applies only to selected products."}
                </p>
                <button
                  type="button"
                  onClick={() => setAppliesToAll(!appliesToAll)}
                  className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                    appliesToAll ? "bg-primary" : "bg-surface-variant"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      appliesToAll ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {!appliesToAll && (
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  SELECT PRODUCTS ({selectedProducts.size} selected)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    value={productSearch}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-md outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-outline-variant rounded-lg p-2 bg-surface-container-lowest">
                  {productsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 bg-surface-variant/20 rounded animate-pulse" />
                    ))
                  ) : products.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-4">No products found</p>
                  ) : (
                    products.map((p) => {
                      const isSelected = selectedProducts.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-surface-variant/10 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "bg-primary" : "border border-outline-variant"
                            }`}
                          >
                            {isSelected && (
                              <span className="material-symbols-outlined text-[12px] text-on-primary">check</span>
                            )}
                          </div>
                          <span className="text-sm text-on-surface">{p.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                EXPIRY DATE (optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {promoCode && (
              <div className="pt-4 border-t border-outline-variant">
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-on-surface">Active</p>
                    <p className="text-xs text-on-surface-variant">
                      {active ? "This promo code is active." : "This promo code is disabled."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      active ? "bg-primary" : "bg-surface-variant"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        active ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-outline-variant flex gap-3 bg-surface-container">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-label-caps text-label-caps hover:bg-surface-variant/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !value.trim() || (!appliesToAll && selectedProducts.size === 0)}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-caps text-label-caps font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              )}
              {submitting ? "Saving..." : promoCode ? "Save Changes" : "Create Promo Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
