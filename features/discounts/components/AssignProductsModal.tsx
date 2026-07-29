"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { discountsApi } from "../api";
import { productsApi } from "@/features/products/api";
import type { ProductItem } from "../types";

interface AssignProductsModalProps {
  discountId: string;
  discountName: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignProductsModal({
  discountId,
  discountName,
  onClose,
  onAssigned,
}: AssignProductsModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      const result = await productsApi.search({ keyword, page: 1, size: 50 });
      setProducts(result.items.map((p) => ({ id: p.id, name: p.name })));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(search);
  }, [fetchProducts]);

  function handleSearch(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(val), 300);
  }

  function toggleProduct(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setError("");
    setSubmitting(true);
    try {
      await discountsApi.assignProducts(discountId, { product_ids: Array.from(selected) });
      onAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("discount.failedToAssign"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("discount.assignProducts")}</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              {t("discount.selectProductsFor", { name: discountName })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 border-b border-outline-variant">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("discount.searchProducts")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-md outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-variant/20 rounded-lg animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-[40px] text-outline">inventory_2</span>
              <p className="text-on-surface-variant text-sm mt-2">{t("discount.noProductsFound")}</p>
            </div>
          ) : (
            products.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-surface-variant/10 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "bg-primary" : "border border-outline-variant"
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px] text-on-primary">check</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-on-surface">{p.name}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-between items-center">
          <span className="text-sm text-on-surface-variant">
            {t("discount.productsSelected", { count: selected.size })}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleAssign}
              disabled={selected.size === 0 || submitting}
              className="px-6 py-2 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50 hover:brightness-110 transition-all text-sm flex items-center gap-2"
            >
              {submitting && (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              )}
              {submitting ? t("discount.assigning") : t("discount.assignWithCount", { count: selected.size })}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
