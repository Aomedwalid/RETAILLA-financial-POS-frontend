"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { POSProduct } from "../types";

interface ProductCardProps {
  product: POSProduct;
  onSelect: (product: POSProduct) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const { t } = useTranslation();
  const hasVariants = product.variants && product.variants.length > 1;
  const isLowStock = product.is_low_stock ?? (product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold);

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-surface-container-low border border-outline-variant rounded-xl p-3 flex flex-col gap-3 group hover:border-primary/50 transition-all cursor-pointer"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-surface relative flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center text-outline bg-surface-container-highest">
          <span className="material-symbols-outlined text-[40px]">inventory_2</span>
        </div>
        <div className="absolute top-2 right-2">
          {isLowStock ? (
            <span className="px-2 py-0.5 bg-error/10 border border-error/20 rounded text-[10px] font-bold text-error font-data-table">{t("product.lowStock")}</span>
          ) : (
            <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 rounded text-[10px] font-bold text-secondary font-data-table">{t("product.active")}</span>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-xs text-on-surface-variant mb-2">{product.sku}</p>
        <div className="flex items-center justify-between mt-auto gap-1">
          <span className="font-data-table text-headline-sm min-w-0 truncate">
            {Number(product.actual_price) < Number(product.price) ? (
              <span className="inline-flex items-center gap-1">
                <span className="line-through text-outline text-sm">{formatCurrency(product.price)}</span>
                <span className="text-primary">{formatCurrency(product.actual_price)}</span>
              </span>
            ) : (
              <span className="text-primary">{formatCurrency(product.price)}</span>
            )}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(product); }}
            className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
