"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api";
import { validateProductForm, type ValidationErrors } from "../validation";
import type { Category, Discount, ProductResponse, AttributeValue } from "../types";

interface ProductFormProps {
  product?: ProductFormData | null;
  onClose: () => void;
  onSaved: () => void;
}

type ProductFormData = Pick<ProductResponse, "id" | "name" | "price" | "cost" | "low_stock_threshold" | "stock_quantity" | "category_id" | "discount_id" | "variants_enabled" | "variants" | "description" | "internal_notes">;

interface VariantInput {
  id?: string;
  stock_quantity: string;
  attributes: Record<string, string>;
}

const normalizeAttr = (s: string) => s.trim().toLowerCase();

const emptyVariant = (): VariantInput => ({
  stock_quantity: "0",
  attributes: {},
});

export default function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const { t } = useTranslation();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [cost, setCost] = useState(product?.cost != null ? String(product.cost) : "");
  const [stockQty, setStockQty] = useState(String(product?.stock_quantity ?? "0"));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.low_stock_threshold ?? "10"));
  const [internalNotes, setInternalNotes] = useState(product?.internal_notes ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [discountId, setDiscountId] = useState(product?.discount_id ?? "");
  const [variantsEnabled, setVariantsEnabled] = useState(product?.variants_enabled ?? false);

  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants && product.variants.length > 0
      ? product.variants.map((v) => ({
          id: v.id,
          stock_quantity: String(v.stock_quantity),
          attributes: Object.fromEntries(
            Object.entries(v.attributes).map(([k, val]) => [k, String(val)])
          ),
        }))
      : [emptyVariant()]
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(() => {});
    productsApi.getDiscounts().then(setDiscounts).catch(() => {});
  }, []);

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function addAttribute(vIdx: number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === vIdx ? { ...v, attributes: { ...v.attributes, "": "" } } : v))
    );
  }

  function updateAttributeKey(vIdx: number, oldKey: string, newKey: string) {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== vIdx) return v;
        const { [oldKey]: val, ...rest } = v.attributes;
        return { ...v, attributes: { ...rest, [newKey]: val } };
      })
    );
  }

  function updateAttributeValue(vIdx: number, key: string, value: string) {
    setVariants((prev) =>
      prev.map((v, i) => (i === vIdx ? { ...v, attributes: { ...v.attributes, [key]: value } } : v))
    );
  }

  function removeAttribute(vIdx: number, key: string) {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== vIdx) return v;
        const { [key]: _, ...rest } = v.attributes;
        return { ...v, attributes: rest };
      })
    );
  }

  function updateVariantStock(vIdx: number, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === vIdx ? { ...v, stock_quantity: value } : v)));
  }

  async function handleSubmit() {
    const formErrors = validateProductForm({
      name, price, cost, category_id: categoryId,
      variantsEnabled,
      variants: variantsEnabled
        ? variants.map((v) => ({ stock_quantity: v.stock_quantity, attributes: v.attributes }))
        : undefined,
    }, t);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setServerError("");
    setSubmitting(true);

    try {
      const basePayload = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        cost: parseFloat(cost || "0"),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || undefined,
        internal_notes: internalNotes || undefined,
category_id: categoryId || undefined,
        discount_id: discountId || undefined,
      };

      if (variantsEnabled) {
        if (isEdit && product) {
          const variantPayloads = variants.map((v) => {
            const attrs = Object.fromEntries(
              Object.entries(v.attributes)
                .filter(([, val]) => val.trim())
                .map(([k, val]) => [normalizeAttr(k), normalizeAttr(val)])
            );
            const stock = parseInt(v.stock_quantity, 10) || 0;
            const entry: Record<string, unknown> = { id: v.id, stock_quantity: stock };
            if (Object.keys(attrs).length > 0) entry.attributes = attrs;
            return entry;
          });
          await productsApi.update(product.id, { ...basePayload, variants_enabled: true, variants: variantPayloads });
        } else {
          const variantPayloads = variants.map((v) => {
            const attrs = Object.fromEntries(
              Object.entries(v.attributes)
                .filter(([, val]) => val.trim())
                .map(([k, val]) => [normalizeAttr(k), normalizeAttr(val)])
            );
            const stock = parseInt(v.stock_quantity, 10) || 0;
            return { attributes: attrs, stock_quantity: stock };
          });
          await productsApi.create({ ...basePayload, variants_enabled: true, variants: variantPayloads });
        }
      } else {
        if (isEdit && product) {
          await productsApi.update(product.id, basePayload);
        } else {
          await productsApi.create({
            ...basePayload,
            stock_quantity: parseInt(stockQty, 10) || 0,
          });
        }
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("product.failedToSave");
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-xl mx-4 mb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <p className="text-sm font-bold text-on-surface">{isEdit ? t("product.edit") : t("product.create")}</p>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("product.name")} error={errors.name}>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
            <Field label={t("product.description")}>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
            <Field label={t("product.price")} error={errors.price}>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
            <Field label={t("product.cost")} error={errors.cost}>
              <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
            <Field label={t("product.lowStockThreshold")}>
              <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
            <Field label={t("product.category")} error={errors.category_id}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors">
                <option value="">{t("product.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t("product.discount")}>
              <select value={discountId} onChange={(e) => setDiscountId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors">
                <option value="">{t("product.noDiscount")}</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value} ${t("common.currencySymbol")}`})</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("product.internalNotes")}>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors resize-none" />
          </Field>

          {!variantsEnabled && (
            <Field label={t("product.stockQuantity")}>
              <input type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors" />
            </Field>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm text-on-surface">{t("product.hasVariants")}</label>
            <button
              onClick={() => {
                setVariantsEnabled((v) => !v);
                setErrors({});
              }}
              className={`w-10 h-5 rounded-full transition-colors relative ${variantsEnabled ? "bg-primary" : "bg-surface-container-highest"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${variantsEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {variantsEnabled && (
            <div className="space-y-4">
              {errors.variants && <p className="text-[11px] text-error">{errors.variants}</p>}
              {variants.map((v, idx) => (
                <div key={idx} className="border border-outline-variant rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-on-surface">{t("product.variant")} {idx + 1}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-on-surface-variant font-data-table">{parseInt(v.stock_quantity, 10) || 0} {t("product.stock")}</span>
                      {variants.length > 1 && (
                        <button onClick={() => removeVariant(idx)} className="text-xs text-error hover:underline">{t("product.removeVariant")}</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-on-surface-variant">{t("product.attributes")}</p>
                      <button onClick={() => addAttribute(idx)} className="text-[11px] text-primary hover:underline">+ {t("product.addVariant")}</button>
                    </div>
                    {Object.keys(v.attributes).length === 0 ? (
                      <p className="text-xs text-outline">{t("product.noVariants")}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {Object.entries(v.attributes).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <input value={key} onChange={(e) => updateAttributeKey(idx, key, e.target.value)} placeholder={t("productForm.attributeName")} className="flex-1 h-8 px-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-xs outline-none focus:border-primary transition-colors placeholder:text-outline/50" />
                            <input value={val} onChange={(e) => updateAttributeValue(idx, key, e.target.value)} placeholder={t("productForm.attributeValue")} className="flex-1 h-8 px-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-xs outline-none focus:border-primary transition-colors placeholder:text-outline/50" />
                            <button onClick={() => removeAttribute(idx, key)} className="text-on-surface-variant hover:text-error">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors[`variants.${idx}.keys`] && <p className="text-[11px] text-error mt-1">{errors[`variants.${idx}.keys`]}</p>}
                    {errors[`variants.${idx}.duplicate`] && <p className="text-[11px] text-error mt-1">{errors[`variants.${idx}.duplicate`]}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] text-on-surface-variant block mb-1">{t("product.stockQuantity")}</label>
                    <input type="number" min="0" value={v.stock_quantity} onChange={(e) => updateVariantStock(idx, e.target.value)} className="w-24 h-8 px-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-xs font-data-table outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              ))}
              <button onClick={addVariant} className="w-full py-2.5 rounded-lg border-2 border-dashed border-outline-variant text-xs text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span>
                {t("product.addVariant")}
              </button>
            </div>
          )}
        </div>

        {serverError && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 justify-end p-6 border-t border-outline-variant">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-on-surface-variant">{label}</label>
      {children}
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  );
}
