"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { posApi } from "../api";
import type { Customer } from "../types";

interface CustomerSelectorProps {
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
}

export default function CustomerSelector({ selected, onSelect }: CustomerSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleSearch(val: string) {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (!val.trim()) {
      requestSeq.current++;
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      setLoading(true);
      try {
        const res = await posApi.searchCustomers(val.trim());
        if (seq === requestSeq.current) setResults(res);
      } catch {
        if (seq === requestSeq.current) setResults([]);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 300);
  }

  return (
    <div ref={ref} className="relative">
      <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("customer.title")}</label>
      {selected ? (
        <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
          <div>
            <p className="text-sm text-on-surface">{selected.name || selected.email}</p>
            <p className="text-[11px] text-outline">{selected.email}</p>
          </div>
          <button onClick={() => { onSelect(null); setQuery(""); }} className="text-[12px] text-error hover:underline">{t("common.delete")}</button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { handleSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={t("search.placeholder")}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          {open && query && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {loading && <p className="p-3 text-sm text-on-surface-variant">{t("common.loading")}</p>}
              {!loading && results.length === 0 && (
                <p className="p-3 text-sm text-on-surface-variant">{t("customer.noCustomers")}</p>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-variant/20 transition-colors"
                >
                  <p className="text-sm text-on-surface">{c.name || c.email}</p>
                  {c.name && <p className="text-[11px] text-outline">{c.email}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
