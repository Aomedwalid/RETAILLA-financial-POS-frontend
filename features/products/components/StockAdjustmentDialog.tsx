"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api";
import { validateStockAdjustment } from "../validation";
import type { ProductResponse } from "../types";

interface StockAdjustmentDialogProps {
  product: ProductResponse;
  onClose: () => void;
  onAdjusted: () => void;
}

export default function StockAdjustmentDialog({ product, onClose, onAdjusted }: StockAdjustmentDialogProps) {
  const { t } = useTranslation();
  const variants = product.variants ?? [];
  const [type, setType] = useState<"ADD" | "SUBTRACT">("ADD");
  const [quantity, setQuantity] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const showVariantPicker = variants.length > 1;

  async function handleSubmit() {
    const err = validateStockAdjustment(quantity, t);
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const qty = parseInt(quantity, 10);
      const variantId = variants[selectedIdx]?.id;
      await productsApi.adjustStock(product.id, {
        operation: type,
        quantity: qty,
        ...(variantId ? { variant_id: variantId } : {}),
      });
      onAdjusted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("product.stockAdjustmentFailed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-sm p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold text-on-surface mb-1">{t("stock.adjustment")}</p>
        <p className="text-xs text-on-surface-variant mb-5">{product.name}</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1.5 block">{t("stock.adjustment")}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("ADD")}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                  type === "ADD"
                    ? "bg-secondary text-on-secondary"
                    : "border border-outline/30 text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t("stock.adjust")}
              </button>
              <button
                onClick={() => setType("SUBTRACT")}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                  type === "SUBTRACT"
                    ? "bg-error text-on-error"
                    : "border border-outline/30 text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t("common.delete")}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-on-surface-variant mb-1.5 block">{t("product.quantity")}</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors"
              placeholder={t("product.quantity")}
            />
          </div>

          {showVariantPicker && (
            <div>
              <label className="text-xs text-on-surface-variant mb-1.5 block">{t("product.variant")}</label>
              <select
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors"
              >
                {variants.map((v, idx) => (
                  <option key={v.id} value={idx}>
                    {Object.entries(v.attributes).map(([k, val]) => `${k}: ${String(val)}`).join(", ") || t("product.default")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-on-surface-variant">
            {t("stock.currentStock")}: <span className="font-bold text-on-surface">{product.stock_quantity}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg mt-4">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("common.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
