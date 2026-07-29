"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api";
import type { Category } from "../types";

interface ProductFiltersProps {
  categoryId: string;
  inStock: string;
  lowStock: string;
  onCategoryChange: (val: string) => void;
  onInStockChange: (val: string) => void;
  onLowStockChange: (val: string) => void;
}

export default function ProductFilters({
  categoryId,
  inStock,
  lowStock,
  onCategoryChange,
  onInStockChange,
  onLowStockChange,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors min-w-[140px]"
      >
        <option value="">{t("filter.allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={inStock}
        onChange={(e) => onInStockChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors min-w-[120px]"
      >
        <option value="">{t("filter.all")}</option>
        <option value="true">{t("product.active")}</option>
        <option value="false">{t("product.inactive")}</option>
      </select>

      <select
        value={lowStock}
        onChange={(e) => onLowStockChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors min-w-[140px]"
      >
        <option value="">{t("filter.all")}</option>
        <option value="true">{t("product.lowStock")}</option>
      </select>
    </div>
  );
}
