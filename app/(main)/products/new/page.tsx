"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productsApi } from "@/features/products/api";
import { validateProductForm } from "@/features/products/validation";
import type { Category, Discount, CreateProductPayload } from "@/features/products/types";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";

interface VariantInput {
  stock_quantity: string;
  attributes: Record<string, string>;
}

interface ValidationErrors {
  [key: string]: string;
}

const emptyVariant = (): VariantInput => ({
  stock_quantity: "0",
  attributes: {},
});

const normalizeAttr = (s: string) => s.trim().toLowerCase();

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [internalNotes, setInternalNotes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<VariantInput[]>([emptyVariant()]);

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

  function validate(): boolean {
    const formData = {
      name, price, cost, category_id: categoryId,
      variantsEnabled,
      variants: variantsEnabled
        ? variants.map((v) => ({
            stock_quantity: v.stock_quantity,
            attributes: Object.fromEntries(
              Object.entries(v.attributes).filter(([, val]) => val.trim())
            ),
          }))
        : undefined,
    };
    const errs = validateProductForm(formData, t);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setServerError("");
    setSubmitting(true);
    try {
      const payload: CreateProductPayload = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        cost: parseFloat(cost || "0"),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        internal_notes: internalNotes || undefined,
category_id: categoryId || undefined,
        discount_id: discountId || undefined,
      };

      if (variantsEnabled) {
        payload.variants_enabled = true;
        payload.variants = variants.map((v) => {
          const normalized: Record<string, string> = {};
          for (const [k, val] of Object.entries(v.attributes)) {
            if (val.trim()) normalized[normalizeAttr(k)] = normalizeAttr(val);
          }
          return {
            stock_quantity: parseInt(v.stock_quantity, 10) || 0,
            attributes: normalized,
          };
        });
      } else {
        payload.stock_quantity = parseInt(stockQty, 10) || 0;
      }

      await productsApi.create(payload);
      router.push("/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-outline text-sm mb-1">
            <Link href="/products" className="hover:text-on-surface transition-colors">{t("product.title")}</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface truncate">{t("product.newProduct")}</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t("product.newProduct")}</h2>
          <p className="text-on-surface-variant mt-1 text-sm">{t("product.description")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors text-sm font-medium"
          >
            {t("common.cancel")}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("product.newProduct")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-gutter">

          {/* Basic Info */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <h3 className="font-label-caps text-label-caps text-on-surface">{t("product.basics")}</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.name")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-surface-container-lowest border rounded-lg py-2.5 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors ${errors.name ? "border-error" : "border-outline-variant"}`}
                  placeholder={t("product.namePlaceholder")}
                />
                {errors.name && <p className="text-[11px] text-error mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.name}</p>}
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("common.description")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none transition-colors"
                  placeholder={t("product.descriptionPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.category")}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full bg-surface-container-lowest border rounded-lg py-2.5 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors ${errors.category_id ? "border-error" : "border-outline-variant"}`}
                  >
                    <option value="">{t("product.selectCategory")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-[11px] text-error mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.category_id}</p>}
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("common.discount")} ({t("common.optional")})</label>
                  <select
                    value={discountId}
                    onChange={(e) => setDiscountId(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors"
                  >
                    <option value="">{t("common.noResults")}</option>
                    {discounts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.type === "PERCENTAGE" ? `${d.value.toLocaleString("ar-EG")}%` : `${d.value.toLocaleString("ar-EG")} ${t("common.currencySymbol")}`})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Costs */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[20px]">attach_money</span>
              <h3 className="font-label-caps text-label-caps text-on-surface">{t("product.pricing")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.price")}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-body-md">{t("common.currencySymbol")}</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`w-full bg-surface-container-lowest border rounded-lg py-2.5 pl-8 pr-4 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table transition-colors ${errors.price ? "border-error" : "border-outline-variant"}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-[11px] text-error mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.price}</p>}
              </div>
              <div className="relative">
                <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.cost")}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-body-md">{t("common.currencySymbol")}</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className={`w-full bg-surface-container-lowest border rounded-lg py-2.5 pl-8 pr-4 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table transition-colors ${errors.cost ? "border-error" : "border-outline-variant"}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.cost && <p className="text-[11px] text-error mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errors.cost}</p>}
              </div>
            </div>
            {price && cost && parseFloat(price) > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold ${parseFloat(cost) >= parseFloat(price) ? "text-error" : "text-secondary"}`}>
                  {parseFloat(cost) >= parseFloat(price) ? t("product.marginNoProfit") : t("product.marginPercent", { percent: ((1 - parseFloat(cost) / parseFloat(price)) * 100).toLocaleString("ar-EG", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) })}
                </span>
                {parseFloat(cost) < parseFloat(price) && (
                  <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                )}
              </div>
            )}
          </div>

          {/* Stock / Variants Section */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
                <h3 className="font-label-caps text-label-caps text-on-surface">{t("product.stockVariants")}</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer gap-3">
                <span className="text-[11px] text-on-surface-variant font-medium">{t("product.hasVariants")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setVariantsEnabled((v) => !v);
                    setErrors({});
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${variantsEnabled ? "bg-primary" : "bg-surface-container-highest"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-md ${variantsEnabled ? "translate-x-5" : ""}`} />
                </button>
              </label>
            </div>

            {!variantsEnabled ? (
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.initialStock")}</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                    <span className="material-symbols-outlined text-[18px]">inventory</span>
                  </span>
                  <input
                    type="number" min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table transition-colors"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-outline mt-1.5">{t("product.stockDescription")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {errors.variants && (
                  <p className="text-[11px] text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.variants}
                  </p>
                )}
                {variants.map((v, idx) => (
                  <div key={idx} className="bg-surface-container-lowest/50 border border-outline-variant rounded-xl overflow-hidden animate-scale-in">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-high/40 border-b border-outline-variant/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[16px]">layers</span>
                        </div>
                        <span className="font-medium text-sm text-on-surface">{t("product.variant")} {idx + 1}</span>
                        {Object.values(v.attributes).filter(Boolean).length > 0 && (
                          <div className="flex items-center gap-1.5 ml-2">
                            {Object.entries(v.attributes).filter(([, val]) => val).slice(0, 2).map(([k, val]) => (
                              <span key={k} className="bg-surface-variant/40 text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-medium">
                                {k}: {val}
                              </span>
                            ))}
                            {Object.values(v.attributes).filter(Boolean).length > 2 && (
                              <span className="text-[10px] text-outline">{t("product.andMore", { count: Object.values(v.attributes).filter(Boolean).length - 2 })}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-on-surface-variant font-data-table">{parseInt(v.stock_quantity, 10) || 0} {t("product.inStock")}</span>
                        {variants.length > 1 && (
                          <button onClick={() => removeVariant(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error/15 text-on-surface-variant hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-medium text-outline tracking-wider uppercase">{t("product.attributes")}</span>
                          <button onClick={() => addAttribute(idx)} className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            {t("common.add")}
                          </button>
                        </div>
                        {Object.keys(v.attributes).length === 0 ? (
                          <p className="text-xs text-outline py-2">{t("product.noAttributes")}</p>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(v.attributes).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-2 group">
                                <input
                                  value={key}
                                  onChange={(e) => updateAttributeKey(idx, key, e.target.value)}
                                  placeholder={t("product.attributeKeyPlaceholder")}
                                  className="flex-1 h-9 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 outline-none focus:ring-1 focus:ring-primary text-xs transition-colors placeholder:text-outline/50"
                                />
                                <input
                                  value={val}
                                  onChange={(e) => updateAttributeValue(idx, key, e.target.value)}
                                  placeholder={t("product.attributeValuePlaceholder")}
                                  className="flex-1 h-9 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 outline-none focus:ring-1 focus:ring-primary text-xs transition-colors placeholder:text-outline/50"
                                />
                                <button onClick={() => removeAttribute(idx, key)} className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/15 text-on-surface-variant hover:text-error transition-all">
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {errors[`variants.${idx}.keys`] && <p className="text-[11px] text-error mt-1.5">{errors[`variants.${idx}.keys`]}</p>}
                        {errors[`variants.${idx}.duplicate`] && <p className="text-[11px] text-error mt-1.5">{errors[`variants.${idx}.duplicate`]}</p>}
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-outline tracking-wider uppercase mb-2 block">{t("product.initialStock")}</label>
                        <div className="relative max-w-[200px]">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                            <span className="material-symbols-outlined text-[18px]">inventory</span>
                          </span>
                          <input
                            type="number" min="0"
                            value={v.stock_quantity}
                            onChange={(e) => updateVariantStock(idx, e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table transition-colors"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addVariant} className="w-full py-3.5 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-medium group">
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add</span>
                  {t("common.add")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-gutter">
          {/* Inventory Settings */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
              <h3 className="font-label-caps text-label-caps text-on-surface">{t("product.inventory")}</h3>
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block tracking-wider">{t("product.lowStockThreshold")}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined text-[18px]">priority_high</span>
                </span>
                <input
                  type="number" min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table transition-colors"
                  placeholder="5"
                />
              </div>
              <p className="text-[10px] text-outline mt-1.5">{t("product.lowStockDescription")}</p>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-[20px]">notes</span>
              <h3 className="font-label-caps text-label-caps text-on-surface">{t("common.notes")}</h3>
            </div>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={5}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none transition-colors"
              placeholder={t("product.notesPlaceholder")}
            />
            <p className="text-[10px] text-outline mt-2">{t("product.notesVisibility")}</p>
          </div>

          {/* Summary Card */}
          {(name || price || variantsEnabled) && (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-scale-in">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">summarize</span>
                <h3 className="font-label-caps text-label-caps text-on-surface">{t("common.summary")}</h3>
              </div>
              <div className="space-y-3">
                {name && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-outline">{t("product.name")}</span>
                    <span className="text-xs text-on-surface font-medium truncate max-w-[140px]">{name}</span>
                  </div>
                )}
                {price && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-outline">{t("product.price")}</span>
                    <span className="text-xs text-on-surface font-data-table">{formatCurrency(parseFloat(price))}</span>
                  </div>
                )}
                {cost && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-outline">{t("product.cost")}</span>
                    <span className="text-xs text-on-surface font-data-table">{formatCurrency(parseFloat(cost))}</span>
                  </div>
                )}
                {!variantsEnabled && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-outline">{t("product.stock")}</span>
                    <span className="text-xs text-on-surface font-data-table">{parseInt(stockQty, 10) || 0} {t("product.units")}</span>
                  </div>
                )}
                {variantsEnabled && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-outline">{t("product.variant")}</span>
                      <span className="text-xs text-on-surface font-medium">{variants.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-outline">{t("product.totalStock")}</span>
                      <span className="text-xs text-on-surface font-data-table">
                        {variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity, 10) || 0), 0)} {t("product.units")}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {serverError && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-start gap-3 animate-scale-in">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0">error</span>
              <div>
                <p className="text-sm font-medium text-error">{t("common.error")}</p>
                <p className="text-xs text-error/80 mt-1">{serverError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
