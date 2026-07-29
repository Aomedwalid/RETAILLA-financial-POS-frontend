"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { discountsApi } from "../api";
import type { Discount, DiscountCreate, DiscountUpdate, DiscountType } from "../types";

interface DiscountSlideOverProps {
  discount?: Discount | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

export default function DiscountSlideOver({
  discount,
  onClose,
  onSaved,
  onError,
}: DiscountSlideOverProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(discount?.name ?? "");
  const [type, setType] = useState<DiscountType>(discount?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(discount ? String(discount.value) : "");
  const [maxDiscount, setMaxDiscount] = useState(
    discount?.max_discount_amount != null ? String(discount.max_discount_amount) : ""
  );
  const [active, setActive] = useState(discount?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !value.trim()) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    if (type === "PERCENTAGE" && numValue > 100) return;

    const numMax = maxDiscount ? parseFloat(maxDiscount) : undefined;

    setSubmitting(true);
    try {
      if (discount) {
        const payload: DiscountUpdate = { active };
        if (name.trim() !== discount.name) payload.name = name.trim();
        if (type !== discount.type) payload.type = type;
        if (numValue !== discount.value) payload.value = numValue;
        if (numMax !== (discount.max_discount_amount ?? undefined)) payload.max_discount_amount = numMax;
        await discountsApi.update(discount.id, payload);
      } else {
        const payload: DiscountCreate = {
          name: name.trim(),
          type,
          value: numValue,
        };
        if (type === "PERCENTAGE" && numMax !== undefined) payload.max_discount_amount = numMax;
        await discountsApi.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : t("discount.failedToSave"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-100 pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[95vw] max-w-[450px] bg-surface-container pointer-events-auto border-l border-outline-variant shadow-2xl">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {discount ? t("discount.edit") : t("discount.new")}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                {t("discount.name")}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("discount.namePlaceholder")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  {t("discount.type")}
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as DiscountType);
                    if (e.target.value === "PRICE") setMaxDiscount("");
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none"
                >
                  <option value="PERCENTAGE">{t("discount.percentage")}</option>
                  <option value="PRICE">{t("discount.fixedAmount")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  {t("discount.value")}
                </label>
                <input
                  type="number"
                  step={type === "PERCENTAGE" ? "1" : "0.01"}
                  min="0"
                  max={type === "PERCENTAGE" ? "100" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "PERCENTAGE" ? "20" : "10.00"}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {type === "PERCENTAGE" && (
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-outline block tracking-wider">
                  {t("discount.maxAmount")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder={t("discount.noLimit")}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            )}

            {discount && (
              <div className="pt-4 border-t border-outline-variant">
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{t("discount.active")}</p>
                    <p className="text-xs text-on-surface-variant">
                      {active ? t("discount.activeDescription") : t("discount.disabledDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      active ? "bg-primary" : "bg-surface-variant"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        active ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-outline-variant flex gap-3 bg-surface-container">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-label-caps text-label-caps hover:bg-surface-variant/20 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !value.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-caps text-label-caps font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              )}
              {submitting ? t("common.saving") : discount ? t("discount.saveChanges") : t("discount.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
