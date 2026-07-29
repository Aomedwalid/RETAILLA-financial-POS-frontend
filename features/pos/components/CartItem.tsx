"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
  onUpdate: (variantId: string, quantity: number) => Promise<unknown>;
  onRemove: (variantId: string) => Promise<unknown>;
}

export default function CartItemRow({ item, onUpdate, onRemove }: CartItemProps) {
  const [localQty, setLocalQty] = useState(item.quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attrEntries = Object.entries(item.attributes).filter(([, v]) => v);

  useEffect(() => {
    setLocalQty(item.quantity);
  }, [item.quantity]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function changeQty(delta: number) {
    const next = localQty + delta;
    if (next < 1 || next > item.stock_quantity) return;

    setLocalQty(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await onUpdate(item.variant_id, next);
      } catch {
        setLocalQty(item.quantity);
      }
    }, 350);
  }

  const displayTotal = localQty === item.quantity
    ? item.line_total
    : (item.quantity > 0
        ? ((parseFloat(item.line_total) / item.quantity) * localQty).toFixed(2)
        : "0.00");

  return (
    <div className="flex gap-3 group">
      <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-outline-variant overflow-hidden shrink-0 flex items-center justify-center text-outline">
        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-semibold text-on-surface truncate pr-2">{item.product_name}</h4>
          <span className="font-data-table text-xs font-medium text-primary">{formatCurrency(displayTotal)}</span>
        </div>
        {item.variant_name && <p className="text-[10px] text-on-surface-variant">{item.variant_name}</p>}
        {attrEntries.length > 0 && (
          <p className="text-[10px] text-on-surface-variant truncate">{attrEntries.map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 bg-surface-container-highest rounded border border-outline-variant px-1">
            <button
              onClick={() => changeQty(-1)}
              disabled={localQty <= 1}
              className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="w-6 text-center text-xs font-bold font-data-table">{localQty}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={localQty >= item.stock_quantity}
              className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
          <button
            onClick={() => onRemove(item.variant_id)}
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
