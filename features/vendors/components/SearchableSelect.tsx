"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface SearchableItem {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  items: SearchableItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  loading?: boolean;
  error?: string;
}

export default function SearchableSelect({ items, value, onChange, placeholder, loading, error }: SearchableSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((i) => i.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-left flex items-center justify-between gap-2 hover:border-outline/50 transition-colors"
      >
        <span className={selected ? "text-on-surface truncate" : "text-outline truncate"}>
          {selected ? selected.name : loading ? t("common.loading") : error || placeholder}
        </span>
        <span className="material-symbols-outlined text-[16px] text-outline shrink-0" aria-hidden="true">arrow_drop_down</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-outline-variant/50">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-surface-container-lowest border border-outline/20 text-sm text-on-surface outline-none focus:border-primary"
              placeholder={t("common.search")}
            />
          </div>
          <div className="max-h-52 overflow-y-auto" role="listbox">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-outline">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                {t("common.loading")}
              </div>
            ) : error ? (
              <div className="px-3 py-2.5 text-sm text-error">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-outline">{t("common.noResults")}</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={value === item.id}
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-surface-variant/30 transition-colors ${
                    value === item.id ? "text-primary font-semibold bg-primary/5" : "text-on-surface-variant"
                  }`}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
