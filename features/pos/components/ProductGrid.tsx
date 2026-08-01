"use client";

import { useTranslation } from "react-i18next";
import type { POSProduct } from "../types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: POSProduct[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  size: number;
  onPageChange: (p: number) => void;
  onSelect: (product: POSProduct) => void;
}

export default function ProductGrid({ products, loading, page, totalPages, totalItems, size, onPageChange, onSelect }: ProductGridProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-surface-container-highest/60 mb-3" />
            <div className="h-3 w-1/2 rounded bg-surface-container-highest/60 mb-4" />
            <div className="h-6 w-1/3 rounded bg-surface-container-highest/60" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3">search_off</span>
        <p className="text-body-md text-on-surface-variant">{t("pos.noProducts")}</p>
        <p className="text-[12px] text-outline mt-1">{t("common.noResults")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onSelect={onSelect} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded bg-surface-container-lowest border border-outline-variant text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages || p < 1) return null;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  p === page
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-lowest border border-outline-variant text-outline hover:bg-surface-variant/40"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded bg-surface-container-lowest border border-outline-variant text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
        </div>
      )}
      {totalItems > 0 && (
        <div className="text-center mt-3">
          <span className="text-[12px] text-outline">
            {t("common.showing")} {Math.min((page - 1) * size + 1, totalItems)}–{Math.min(page * size, totalItems)} {t("common.of")} {totalItems} {t("common.items")}
          </span>
        </div>
      )}
    </div>
  );
}
