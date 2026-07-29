"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { vendorsApi } from "@/features/vendors/api";
import { productsApi, categoriesApi } from "@/features/products/api";
import { fmt } from "@/features/vendors/types";
import type { Category, Discount } from "@/features/products/types";
import type { ConfirmReceiptResponse } from "@/features/vendors/types";
import SearchableSelect from "./SearchableSelect";

export interface VariantForm {
  id: string;
  attrs: { key: string; value: string }[];
  quantity: number;
}

export interface LineForm {
  id: string;
  raw_name: string;
  product_name: string;
  is_variant_group: boolean;
  matched_product_id: string | null;
  is_new_product: boolean;
  description: string;
  price: string;
  cost: string;
  category_id: string;
  discount_id: string;
  low_stock_threshold: string;
  internal_notes: string;
  variants: VariantForm[];
}

interface CreatePurchaseOrderModalProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  onDone: (result: ConfirmReceiptResponse) => void;
  initialLines?: LineForm[];
  initialBillReference?: string;
  initialDueDate?: string;
  initialNotes?: string;
  isReopen?: boolean;
  readOnly?: boolean;
}

let _idCounter = 0;
function uid() { return `po_${++_idCounter}`; }

function makeEmptyLine(): LineForm {
  return {
    id: uid(),
    raw_name: "",
    product_name: "",
    is_variant_group: false,
    matched_product_id: null,
    is_new_product: true,
    description: "",
    price: "",
    cost: "",
    category_id: "",
    discount_id: "",
    low_stock_threshold: "",
    internal_notes: "",
    variants: [{ id: uid(), attrs: [], quantity: 1 }],
  };
}

function makeEmptyVariant(): VariantForm {
  return { id: uid(), attrs: [], quantity: 1 };
}

export default function CreatePurchaseOrderModal({
  vendorId, vendorName, onClose, onDone,
  initialLines, initialBillReference, initialDueDate, initialNotes, isReopen, readOnly,
}: CreatePurchaseOrderModalProps) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<LineForm[]>(() => initialLines ?? [makeEmptyLine()]);
  const [billReference, setBillReference] = useState(initialBillReference ?? "");
  const [dueDate, setDueDate] = useState(initialDueDate ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConfirmReceiptResponse | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState("");

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [discError, setDiscError] = useState("");

  useEffect(() => {
    categoriesApi.list({ active: true, size: 200 })
      .then((res) => setCategories(res.items))
      .catch(() => setCatError(t("common.failedToLoad")))
      .finally(() => setCatLoading(false));
    productsApi.getDiscounts()
      .then(setDiscounts)
      .catch(() => setDiscError(t("common.failedToLoad")))
      .finally(() => setDiscLoading(false));
  }, []);

  const totalCost = useMemo(() =>
    lines.reduce((s, line) => {
      const cost = parseFloat(line.cost) || 0;
      return s + line.variants.reduce((sv, v) => sv + v.quantity * cost, 0);
    }, 0),
    [lines]
  );

  const isValid = useMemo(() => {
    if (lines.length === 0) return false;
    return lines.every((line) => {
      if (!line.product_name.trim()) return false;
      if (line.variants.length === 0) return false;
      if (!line.variants.every((v) => v.quantity >= 1)) return false;
      const p = parseFloat(line.price);
      const c = parseFloat(line.cost);
      return !isNaN(p) && p > 0 && !isNaN(c) && c > 0;
    });
  }, [lines]);

  function addLine() {
    setLines((prev) => [...prev, makeEmptyLine()]);
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }

  function updateLine(lineId: string, patch: Partial<LineForm>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  }

  function addVariant(lineId: string) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, variants: [...l.variants, makeEmptyVariant()] } : l))
    );
  }

  function removeVariant(lineId: string, variantId: string) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, variants: l.variants.filter((v) => v.id !== variantId) }
          : l
      )
    );
  }

  function updateVariant(lineId: string, variantId: string, patch: Partial<VariantForm>) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, variants: l.variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)) }
          : l
      )
    );
  }

  function addAttribute(lineId: string, variantId: string) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              variants: l.variants.map((v) =>
                v.id === variantId
                  ? { ...v, attrs: [...v.attrs, { key: "", value: "" }] }
                  : v
              ),
            }
          : l
      )
    );
  }

  function updateAttribute(lineId: string, variantId: string, attrIndex: number, patch: Partial<{ key: string; value: string }>) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              variants: l.variants.map((v) =>
                v.id === variantId
                  ? {
                      ...v,
                      attrs: v.attrs.map((a, i) => (i === attrIndex ? { ...a, ...patch } : a)),
                    }
                  : v
              ),
            }
          : l
      )
    );
  }

  function removeAttribute(lineId: string, variantId: string, attrIndex: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              variants: l.variants.map((v) =>
                v.id === variantId
                  ? { ...v, attrs: v.attrs.filter((_, i) => i !== attrIndex) }
                  : v
              ),
            }
          : l
      )
    );
  }

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        lines: lines.map((l) => {
          const line: Record<string, unknown> = {
            raw_name: l.raw_name || l.product_name,
            product_name: l.product_name,
            is_variant_group: l.is_variant_group,
            matched_product_id: l.matched_product_id,
            variants: l.variants.map((v) => {
              const attrs: Record<string, string> = {};
              for (const a of v.attrs) {
                if (a.key.trim()) attrs[a.key.trim()] = a.value.trim();
              }
              return {
                attributes: attrs,
                quantity: v.quantity,
              };
            }),
            price: parseFloat(l.price) || 0,
            cost: parseFloat(l.cost) || 0,
          };
          if (l.description.trim()) line.description = l.description.trim();
          if (l.category_id) line.category_id = l.category_id;
          if (l.discount_id) line.discount_id = l.discount_id;
          const threshold = parseInt(l.low_stock_threshold, 10);
          if (!isNaN(threshold) && threshold > 0) line.low_stock_threshold = threshold;
          if (l.internal_notes.trim()) line.internal_notes = l.internal_notes.trim();
          return line;
        }),
        bill_reference: billReference.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes: notes.trim() || null,
      };
      const res = await vendorsApi.manualReceipt(vendorId, payload as never);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("purchaseOrder.failedToCreate");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [vendorId, lines, billReference, dueDate, notes, isValid]);

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in p-6 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-secondary">check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface">{t("vendor.poCreated")}</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {result.new_products_created > 0 && `${result.new_products_created} ${t("vendor.newProductsAdded")} \u2022 `}
              {t("vendor.billOf")} {fmt(result.bill.amount)} {t("vendor.saved")}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">PO #{result.purchase_order.id.slice(0, 8)}</span>
              <span className="font-data-table text-on-surface font-bold">{result.purchase_order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("vendor.billAmount")}</span>
              <span className="font-data-table font-bold text-on-surface">{fmt(result.bill.amount)}</span>
            </div>
            {result.new_products_created > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("vendor.newProducts")}</span>
                <span className="font-data-table font-bold text-on-surface">{result.new_products_created}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onDone(result)}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold"
          >
            {t("common.done")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl max-h-[95vh] bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl flex flex-col animate-scale-in">
        <div className="shrink-0 px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {readOnly ? t("purchaseOrder.details") : isReopen ? t("purchaseOrder.edit") : t("purchaseOrder.create")}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{vendorName}</p>
          </div>
          <button onClick={onClose} disabled={submitting} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant disabled:opacity-30">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <fieldset disabled={readOnly} className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
          {lines.map((line, li) => (
            <div key={line.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("purchaseOrder.line")} {li + 1}</span>
                {!readOnly && lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="text-[11px] text-error flex items-center gap-1 hover:bg-error/10 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">remove</span>
                    {t("purchaseOrder.removeLine")}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={`${t("purchaseOrder.productName")} *`}>
                  <input
                    value={line.product_name}
                    onChange={(e) => updateLine(line.id, { product_name: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                    placeholder={t("purchaseOrder.productNamePlaceholder")}
                  />
                </Field>
                <Field label={t("purchaseOrder.rawName")}>
                  <input
                    value={line.raw_name}
                    onChange={(e) => updateLine(line.id, { raw_name: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                    placeholder={t("purchaseOrder.rawNamePlaceholder")}
                  />
                </Field>
              </div>

              <Field label={t("purchaseOrder.description")}>
                <input
                  value={line.description}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                  placeholder={t("purchaseOrder.descriptionPlaceholder")}
                />
              </Field>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label={t("purchaseOrder.sellingPrice")}>
                  <div className="relative">
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-outline text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.price}
                      onChange={(e) => updateLine(line.id, { price: e.target.value })}
                      className="w-full h-9 pr-5 pl-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                      placeholder={t("purchaseOrder.pricePlaceholder")}
                    />
                  </div>
                </Field>
                <Field label={t("purchaseOrder.cost")}>
                  <div className="relative">
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-outline text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.cost}
                      onChange={(e) => updateLine(line.id, { cost: e.target.value })}
                      className="w-full h-9 pr-5 pl-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                      placeholder={t("purchaseOrder.pricePlaceholder")}
                    />
                  </div>
                </Field>
                <Field label={t("purchaseOrder.lowStockThreshold")}>
                  <input
                    type="number"
                    min="0"
                    value={line.low_stock_threshold}
                    onChange={(e) => updateLine(line.id, { low_stock_threshold: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                    placeholder={t("purchaseOrder.lowStockPlaceholder")}
                  />
                </Field>
                <Field label={t("purchaseOrder.category")}>
                  <SearchableSelect
                    items={categories}
                    value={line.category_id}
                    onChange={(id) => updateLine(line.id, { category_id: id })}
                    placeholder={t("purchaseOrder.selectCategory")}
                    loading={catLoading}
                    error={catError}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("purchaseOrder.discount")}>
                  <SearchableSelect
                    items={discounts.map((d) => ({ id: d.id, name: `${d.name} (${d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value} ${t("common.currencySymbol")}`})` }))}
                    value={line.discount_id}
                    onChange={(id) => updateLine(line.id, { discount_id: id })}
                    placeholder={t("purchaseOrder.noDiscount")}
                    loading={discLoading}
                    error={discError}
                  />
                </Field>
                <Field label={t("purchaseOrder.internalNotes")}>
                  <input
                    value={line.internal_notes}
                    onChange={(e) => updateLine(line.id, { internal_notes: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                    placeholder={t("purchaseOrder.internalNotesPlaceholder")}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={line.is_variant_group}
                    onChange={(e) => updateLine(line.id, { is_variant_group: e.target.checked })}
                    className="w-4 h-4 rounded border-outline/50 bg-surface-container-high text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface-variant font-medium">{t("purchaseOrder.hasVariants")}</span>
                </label>
              </div>

              {line.is_variant_group ? (
                <div className="space-y-3 pl-2 border-l-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("product.variants")}</span>
                    <button
                      type="button"
                      onClick={() => addVariant(line.id)}
                      className="text-[11px] text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      {t("purchaseOrder.addVariant")}
                    </button>
                  </div>
                  {line.variants.map((v, vi) => (
                    <div key={v.id} className="bg-surface-container-highest border border-outline-variant rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("purchaseOrder.variant")} {vi + 1}</span>
                        {line.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(line.id, v.id)}
                            className="text-[10px] text-error hover:bg-error/10 px-1.5 py-0.5 rounded transition-colors"
                          >
                            {t("purchaseOrder.removeVariant")}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("product.attributes")}</span>
                          <button
                            type="button"
                            onClick={() => addAttribute(line.id, v.id)}
                            className="text-[10px] text-primary flex items-center gap-0.5 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            {t("purchaseOrder.addAttribute")}
                          </button>
                        </div>
                        {v.attrs.length === 0 ? (
                          <p className="text-[11px] text-outline italic">{t("productForm.noAttributes")}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {v.attrs.map((a, ai) => (
                              <div key={ai} className="flex items-center gap-2">
                                <input
                                  value={a.key}
                                  onChange={(e) => updateAttribute(line.id, v.id, ai, { key: e.target.value })}
                                  className="flex-1 h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary"
                                  placeholder={t("productForm.attributeName")}
                                />
                                <input
                                  value={a.value}
                                  onChange={(e) => updateAttribute(line.id, v.id, ai, { value: e.target.value })}
                                  className="flex-1 h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary"
                                  placeholder={t("productForm.attributeValue")}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAttribute(line.id, v.id, ai)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-error/10 text-outline hover:text-error transition-colors shrink-0"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="max-w-[200px]">
                        <Field label={t("purchaseOrder.stockQty")}>
                          <input
                            type="number"
                            min="1"
                            value={v.quantity}
                            onChange={(e) => updateVariant(line.id, v.id, { quantity: parseInt(e.target.value, 10) || 1 })}
                            className="w-full h-8 px-2 rounded-lg border border-outline/20 bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary font-data-table"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-[200px] pl-2">
                  <Field label={t("product.stockQuantity")}>
                    <input
                      type="number"
                      min="1"
                      value={line.variants[0]?.quantity ?? 1}
                      onChange={(e) => updateVariant(line.id, line.variants[0]?.id ?? "", { quantity: parseInt(e.target.value, 10) || 1 })}
                      className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                    />
                  </Field>
                </div>
              )}
            </div>
          ))}

          {!readOnly && (
            <button
              type="button"
              onClick={addLine}
              className="w-full py-3 rounded-xl border-2 border-dashed border-outline/30 text-sm text-outline hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("purchaseOrder.addLine")}
            </button>
          )}

          <div className="flex justify-end text-sm font-bold text-on-surface font-data-table border-t border-outline-variant pt-3">
            {t("common.total")}: {fmt(totalCost)}
          </div>

          <div className="space-y-4 border-t border-outline-variant pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={t("purchaseOrder.billReference")}>
                <input
                  value={billReference}
                  onChange={(e) => setBillReference(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                  placeholder={t("purchaseOrder.billRefPlaceholder")}
                />
              </Field>
              <Field label={t("purchaseOrder.dueDate")}>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                />
              </Field>
              <Field label={t("purchaseOrder.notes")}>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                  placeholder={t("purchaseOrder.notesPlaceholder")}
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-sm text-error">
              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
        </fieldset>

        <div className="shrink-0 px-6 py-4 border-t border-outline-variant flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            {lines.length} {t("vendor.productLine", { count: lines.length })} &middot; {fmt(totalCost)} {t("common.total")}
          </p>
          <div className="flex gap-3">
            {readOnly ? (
              <button onClick={onClose} className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold">
                {t("common.close")}
              </button>
            ) : (
              <>
                <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      {isReopen ? t("purchaseOrder.confirming") : t("purchaseOrder.creating")}
                    </>
                  ) : (
                    isReopen ? t("purchaseOrder.confirm") : t("purchaseOrder.create")
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1 block">{label}</label>
      {children}
    </div>
  );
}
