"use client";

import { useTranslation } from "react-i18next";

interface CustomerToolbarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeFilter: string;
  onActiveFilterChange: (val: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
}

export default function CustomerToolbar({
  searchValue,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
  onRefresh,
  onAdd,
}: CustomerToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-wrap items-center gap-4 mb-gutter">
      <div className="w-full sm:flex-1 sm:min-w-[240px] relative">
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pr-10 pl-4 text-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>
      <select
        value={activeFilter}
        onChange={(e) => onActiveFilterChange(e.target.value)}
        className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-4 text-body-md text-on-surface-variant outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">{t("common.all")}</option>
        <option value="true">{t("common.active")}</option>
        <option value="false">{t("common.inactive")}</option>
      </select>
      <button
        onClick={onRefresh}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
        title={t("common.refresh")}
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span>
      </button>
      <button
        onClick={onAdd}
        className="w-full sm:w-auto bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        <span className="material-symbols-outlined">person_add</span>
        {t("customer.addNew")}
      </button>
    </div>
  );
}
