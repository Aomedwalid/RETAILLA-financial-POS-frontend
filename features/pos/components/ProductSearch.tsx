"use client";

import { useTranslation } from "react-i18next";
 
interface ProductSearchProps {
  keyword: string;
  onSearch: (val: string) => void;
  categories: { id: string; name: string }[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
}

export default function ProductSearch({ keyword, onSearch, categories, categoryId, onCategoryChange }: ProductSearchProps) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex gap-gutter mb-stack-md">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            defaultValue={keyword}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("pos.searchProducts")}
            className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-body-md focus:border-primary focus:ring-0 transition-all outline-none"
          />
        </div>
      </div>
      {categories.length > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">category</span>
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-body-md text-on-surface-variant outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="">{t("pos.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">expand_more</span>
          </div>
        </div>
      )}
    </div>
  );
}
