"use client";

import { useTranslation } from "react-i18next";
import type { ReviewVariantState } from "@/features/vendors/types";

interface VariantEditorProps {
  variants: ReviewVariantState[];
  onUpdate: (variants: ReviewVariantState[]) => void;
  readOnly?: boolean;
}

export function makeEmptyVariant(): ReviewVariantState {
  return { attributes: {}, quantity: 1 };
}

export function cloneVariants(variants: ReviewVariantState[]): ReviewVariantState[] {
  return variants.map((v) => ({ ...v, attributes: { ...v.attributes } }));
}

export default function VariantEditor({ variants, onUpdate, readOnly }: VariantEditorProps) {
  const { t } = useTranslation();
  function addVariant() {
    onUpdate([...variants, makeEmptyVariant()]);
  }

  function removeVariant(index: number) {
    onUpdate(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof ReviewVariantState, value: string | number | Record<string, string>) {
    onUpdate(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function addAttribute(index: number) {
    const v = variants[index];
    updateVariant(index, "attributes", { ...v.attributes, "": "" });
  }

  function updateAttributeKey(index: number, oldKey: string, newKey: string) {
    const v = variants[index];
    const attrs = { ...v.attributes };
    if (oldKey !== newKey) {
      const val = attrs[oldKey];
      delete attrs[oldKey];
      attrs[newKey] = val;
    }
    updateVariant(index, "attributes", attrs);
  }

  function updateAttributeValue(index: number, key: string, value: string) {
    const v = variants[index];
    updateVariant(index, "attributes", { ...v.attributes, [key]: value });
  }

  function removeAttribute(index: number, key: string) {
    const v = variants[index];
    const attrs = { ...v.attributes };
    delete attrs[key];
    updateVariant(index, "attributes", attrs);
  }

  return (
    <div className="space-y-3 pl-2 border-l-2 border-primary/30">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("product.variants")}</span>
        {!readOnly && (
          <button
            type="button"
            onClick={addVariant}
            className="text-[11px] text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            {t("product.addVariant")}
          </button>
        )}
      </div>
      {variants.map((v, vi) => (
        <div key={vi} className="bg-surface-container-highest border border-outline-variant rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("product.variant")} {vi + 1}</span>
            {!readOnly && variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(vi)}
                className="text-[10px] text-error hover:bg-error/10 px-1.5 py-0.5 rounded transition-colors"
              >
                {t("productForm.remove")}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("product.attributes")}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => addAttribute(vi)}
                  className="text-[10px] text-primary flex items-center gap-0.5 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                  {t("productForm.addAttribute")}
                </button>
              )}
            </div>
            {Object.keys(v.attributes).length === 0 ? (
              <p className="text-[11px] text-outline italic">{t("productForm.noAttributes")}</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(v.attributes).map(([key, val]) => (
                  <div key={key || "_new"} className="flex items-center gap-2">
                    {readOnly ? (
                      <span className="text-xs text-on-surface-variant">
                        {key ? `${key}: ${val}` : ""}
                      </span>
                    ) : (
                      <>
                        <input
                          value={key}
                          onChange={(e) => updateAttributeKey(vi, key, e.target.value)}
                          className="flex-1 h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary"
                          placeholder={t("productForm.attributeName")}
                        />
                        <input
                          value={val}
                          onChange={(e) => updateAttributeValue(vi, key, e.target.value)}
                          className="flex-1 h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary"
                          placeholder={t("productForm.attributeValue")}
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(vi, key)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-error/10 text-outline hover:text-error transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <VariantField label={t("product.stockQuantity")}>
            {readOnly ? (
              <span className="text-xs text-on-surface font-data-table py-1.5 block">{v.quantity}</span>
            ) : (
              <input
                type="number"
                min="1"
                value={v.quantity}
                onChange={(e) => updateVariant(vi, "quantity", parseInt(e.target.value, 10) || 1)}
                className="w-full h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary font-data-table"
              />
            )}
          </VariantField>
        </div>
      ))}
    </div>
  );
}

function VariantField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-[9px] font-bold uppercase tracking-wider text-outline mb-0.5 block">{label}</label>
      {children}
    </div>
  );
}
