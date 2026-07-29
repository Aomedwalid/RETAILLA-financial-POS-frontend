"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { ProductResponse } from "../types";

interface ProductCardProps {
  product: ProductResponse;
  onView: (p: ProductResponse) => void;
  onEdit: (p: ProductResponse) => void;
  onStock: (p: ProductResponse) => void;
  onHistory: (p: ProductResponse) => void;
  onDelete: (p: ProductResponse) => void;
}

export default function ProductCard({ product: p, onView, onEdit, onStock, onHistory, onDelete }: ProductCardProps) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-on-surface">{p.name}</p>
          <p className="text-xs text-on-surface-variant">{p.sku}</p>
        </div>
        <div className="flex items-center gap-1">
          {p.is_low_stock && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-error/20 text-error">LOW</span>
          )}
          {p.discount_id && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">SALE</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div>
          <span className="text-on-surface-variant">{t("product.price")}: </span>
          <span className="font-data-table text-on-surface">{formatCurrency(p.price)}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">{t("product.cost")}: </span>
          <span className="font-data-table text-on-surface">{p.cost != null ? formatCurrency(p.cost) : "—"}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">{t("product.stock")}: </span>
          <span className={`font-data-table ${p.is_low_stock ? "text-error" : "text-secondary"}`}>{p.stock_quantity}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">{t("product.stockQuantity")}: </span>
          <span className="font-data-table text-on-surface-variant">{p.sell_count}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onView(p)} className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">{t("common.viewDetails")}</button>
        <button onClick={() => onEdit(p)} className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">{t("common.edit")}</button>
        <button onClick={() => onStock(p)} className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">{t("product.stock")}</button>
        <button onClick={() => onDelete(p)} className="flex-1 py-2 rounded-lg border border-error/30 text-xs font-medium text-error hover:bg-error/10 transition-colors">{t("common.delete")}</button>
      </div>
    </div>
  );
}
