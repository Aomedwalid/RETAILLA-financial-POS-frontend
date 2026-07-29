"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ProductSearch({ value, onChange, placeholder }: ProductSearchProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t("product.search");
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(val: string) {
    setLocal(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), 300);
  }

  return (
    <div className="relative">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">search</span>
      </span>
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-full h-10 pr-9 pl-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm placeholder:text-on-surface-variant/40 outline-none focus:border-primary transition-colors"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}
