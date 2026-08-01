"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
  onUpdate: (variantId: string, quantity: number) => Promise<unknown>;
  onRemove: (variantId: string) => Promise<unknown>;
}

interface CartLike {
  pricing?: { lines?: { variant_id: string; quantity: number }[] };
}

function CartItemRow({ item, onUpdate, onRemove }: CartItemProps) {
  const { t } = useTranslation();
  const [localQty, setLocalQty] = useState(item.quantity);
  const [prevServerQty, setPrevServerQty] = useState(item.quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attrEntries = Object.entries(item.attributes).filter(([, v]) => v);

  if (prevServerQty !== item.quantity) {
    setPrevServerQty(item.quantity);
    setLocalQty(item.quantity);
  }

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
        const res = (await onUpdate(item.variant_id, next)) as CartLike | undefined;
        const line = res?.pricing?.lines?.find((l) => l.variant_id === item.variant_id);
        if (line && line.quantity !== next) {
          setLocalQty(line.quantity);
        }
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
              aria-label={t("pos.decreaseQty")}
              className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="w-6 text-center text-xs font-bold font-data-table">{localQty}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={localQty >= item.stock_quantity}
              aria-label={t("pos.increaseQty")}
              className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
          <button
            onClick={() => onRemove(item.variant_id)}
            aria-label={t("pos.removeItem")}
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(CartItemRow, (prev, next) => {
  return (
    prev.item.variant_id === next.item.variant_id &&
    prev.item.product_name === next.item.product_name &&
    prev.item.variant_name === next.item.variant_name &&
    prev.item.quantity === next.item.quantity &&
    prev.item.line_total === next.item.line_total &&
    prev.item.unit_price === next.item.unit_price &&
    prev.item.stock_quantity === next.item.stock_quantity &&
    prev.onUpdate === next.onUpdate &&
    prev.onRemove === next.onRemove
  );
});
