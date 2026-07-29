"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { ProductResponse } from "../types";

interface ProductsTableProps {
  products: ProductResponse[];
  loading: boolean;
  onView: (p: ProductResponse) => void;
  onEdit: (p: ProductResponse) => void;
  onStock: (p: ProductResponse) => void;
  onHistory: (p: ProductResponse) => void;
  onDelete: (p: ProductResponse) => void;
}

export default function ProductsTable({
  products,
  loading,
  onView,
  onEdit,
  onStock,
  onHistory,
  onDelete,
}: ProductsTableProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="glass-card rounded-xl overflow-hidden animate-pulse">
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-5 w-48 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-20 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-24 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-16 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-16 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-16 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-12 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-12 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-12 rounded bg-surface-container-highest/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">inventory_2</span>
        <p className="text-sm text-on-surface-variant">{t("product.noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.title")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.sku")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.category")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.price")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.cost")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.stock")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.stockQuantity")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.lowStockThreshold")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("product.discount")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("common.date")}</th>
              <th className="px-4 py-3 text-label-caps text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-high transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface">{p.name}</span>
                    <div className="flex items-center gap-1">
                      {p.is_low_stock && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-error/20 text-error">LOW</span>
                      )}
                      {p.discount_id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">SALE</span>
                      )}
                      {p.resolved_variants_enabled && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">VAR</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-data-table text-sm text-on-surface-variant">{p.sku}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{p.category_name ?? "—"}</td>
                <td className="px-4 py-3 font-data-table text-sm">
                  {Number(p.actual_price) < Number(p.price) ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="line-through text-outline">{formatCurrency(p.price)}</span>
                      <span className="text-primary font-bold">{formatCurrency(p.actual_price)}</span>
                    </span>
                  ) : (
                    <span>{formatCurrency(p.price)}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-data-table text-sm">{p.cost != null ? formatCurrency(p.cost) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`font-data-table text-sm ${p.is_low_stock ? "text-error" : "text-secondary"}`}>
                    {p.stock_quantity}
                  </span>
                </td>
                <td className="px-4 py-3 font-data-table text-sm text-on-surface-variant">{p.sell_count}</td>
                <td className="px-4 py-3 font-data-table text-sm text-on-surface-variant">{p.low_stock_threshold}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">
                  {p.discount_percent != null ? `${p.discount_percent}%` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(p)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors" title={t("common.viewDetails")}>
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button onClick={() => onEdit(p)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors" title={t("common.edit")}>
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => onStock(p)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-secondary transition-colors" title={t("product.stock")}>
                      <span className="material-symbols-outlined text-[16px]">inventory</span>
                    </button>
                    <button onClick={() => onHistory(p)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary transition-colors" title={t("product.history")}>
                      <span className="material-symbols-outlined text-[16px]">history</span>
                    </button>
                    <button onClick={() => onDelete(p)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors" title={t("common.delete")}>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
