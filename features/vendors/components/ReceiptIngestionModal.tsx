"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { vendorsApi } from "@/features/vendors/api";
import { productsApi, categoriesApi } from "@/features/products/api";
import { formatCurrency } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "@/features/vendors/types";
import type { ReviewLineState, PendingReceiptState } from "@/features/vendors/types";
import type { Category, Discount } from "@/features/products/types";
import SearchableSelect from "./SearchableSelect";
import VariantEditor, { makeEmptyVariant } from "./VariantEditor";
import { Field, FormSection } from "./ui";

interface ReceiptIngestionModalProps {
  pendingReceipt: PendingReceiptState;
  onUpdate: (patch: Partial<PendingReceiptState>) => void;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  onDone: () => void;
}

export default function ReceiptIngestionModal({ pendingReceipt, onUpdate, onConfirm, onClose, onDone }: ReceiptIngestionModalProps) {
  const { t } = useTranslation();
  const { lines, extractionNotes, billReference, dueDate, notes } = pendingReceipt;
  const isManual = pendingReceipt.source === "manual";
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ billAmount: string; newProducts: number } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const liveTotal = useMemo(() =>
    lines.reduce((sum, line) => {
      const cost = parseFloat(line.cost) || 0;
      return sum + line.variants.reduce((s, v) => s + v.quantity * cost, 0);
    }, 0),
    [lines]
  );

  const allVariantsValid = useMemo(() => {
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

  const liveNewProductCount = useMemo(() =>
    lines.filter((l) => l.is_new_product).length,
    [lines]
  );

  function acceptFile(f: File): boolean {
    setError("");
    if (f.size > MAX_FILE_SIZE) {
      setError(t("receipt.fileTooLarge"));
      return false;
    }
    const validTypes = ["image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (!validTypes.includes(f.type)) {
      setError(`${t("receipt.invalidFileType")} ${ACCEPTED_EXTENSIONS}`);
      return false;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(URL.createObjectURL(f));
    } else {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    return true;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const result = await vendorsApi.processReceipt(pendingReceipt.vendorId, file);
      const newLines: ReviewLineState[] = result.lines.map((l) => ({
        raw_name: l.raw_name,
        product_name: l.product_name,
        is_variant_group: l.is_variant_group,
        matched_product_id: l.matched_product_id,
        is_new_product: l.is_new_product,
        variants: l.variants.length > 0
          ? l.variants.map((v) => ({
              attributes: { ...v.attributes },
              quantity: v.quantity ?? 1,
            }))
          : [makeEmptyVariant()],
        price: String(l.price ?? 0),
        cost: String(l.cost ?? 0),
        description: "",
        category_id: "",
        discount_id: "",
        low_stock_threshold: "",
        internal_notes: "",
      }));
      onUpdate({
        lines: newLines,
        totalCost: parseFloat(result.total_cost) || 0,
        extractionNotes: result.extraction_notes,
        source: result.source,
        newProductsCount: result.lines.filter((l) => l.is_new_product).length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("receipt.failedToProcess");
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }, [file, pendingReceipt.vendorId, onUpdate]);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setError("");
    try {
      await onConfirm();
      setConfirmed(true);
      setConfirmResult({
        billAmount: formatCurrency(liveTotal),
        newProducts: liveNewProductCount,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("receipt.failedToConfirm");
      setError(`${msg}. ${t("receipt.duplicateWarning")}`);
    } finally {
      setConfirming(false);
    }
  }, [onConfirm, liveTotal, liveNewProductCount]);

  function updateLine(index: number, patch: Partial<ReviewLineState>) {
    onUpdate({
      lines: lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    });
  }

  function updateVariant(lineIndex: number, variants: ReviewLineState["variants"]) {
    onUpdate({
      lines: lines.map((l, i) => (i === lineIndex ? { ...l, variants } : l)),
    });
  }

  const needsUpload = !isManual && lines.length === 0;

  if (confirmed && confirmResult) {
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
            <p className="text-lg font-bold text-on-surface">{t("receipt.confirmed")}</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {confirmResult.newProducts > 0 && `${confirmResult.newProducts} ${t("receipt.newProductsAdded")}`}
              {confirmResult.newProducts > 0 && " \u2022 "}
              {t("receipt.billOf")} {confirmResult.billAmount} {t("receipt.saved")}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("receipt.billAmount")}</span>
              <span className="font-data-table font-bold text-on-surface">{confirmResult.billAmount}</span>
            </div>
            {confirmResult.newProducts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("receipt.newProductsCreated")}</span>
                <span className="font-data-table font-bold text-on-surface">{confirmResult.newProducts}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-outline">{t("receipt.payHint")}</p>
          <button onClick={onDone} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold">
            {t("common.done")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={needsUpload ? undefined : onClose} />
      <div className={`relative bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl flex flex-col animate-scale-in ${
        needsUpload ? "w-[95vw] md:w-full max-w-md" : "w-[95vw] md:w-full max-w-4xl max-h-[90vh]"
      }`} onClick={(e) => e.stopPropagation()}>

        {/* ─── HEADER ─── */}
        <div className="shrink-0 px-4 md:px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {needsUpload ? t("receipt.upload") : isManual ? t("receipt.manual") : t("receipt.reviewLines")}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{pendingReceipt.vendorName}</p>
          </div>
          <button onClick={onClose} disabled={processing || confirming} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant disabled:opacity-30">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ─── UPLOAD STEP ─── */}
        {needsUpload && (
          <div className="p-6 space-y-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-outline/30 hover:border-primary/40"
              }`}
            >
              {filePreview ? (
                <img src={filePreview} alt={t("receipt.previewAlt")} className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[40px] text-primary">description</span>
                  <p className="text-sm text-on-surface font-medium">{file.name}</p>
                  <p className="text-[11px] text-outline">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[40px] text-outline">cloud_upload</span>
                  <p className="text-sm text-on-surface font-medium">{t("receipt.dragAndDrop")}</p>
                  <p className="text-[11px] text-outline">{t("receipt.acceptedFormats")} {ACCEPTED_EXTENSIONS}{t("receipt.maxSize")}</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileChange} className="hidden" />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-sm text-error">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} disabled={processing} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">{t("common.cancel")}</button>
              <button
                onClick={handleProcess}
                disabled={!file || processing}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    {t("receipt.scanning")}
                  </>
                ) : (
                  t("receipt.uploadProcess")
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── REVIEW STEP ─── */}
        {!needsUpload && (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
              {extractionNotes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#d99c00]/10 text-sm text-[#d99c00] border border-[#d99c00]/20">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                  <span>{t("receipt.aiNote")}: {extractionNotes}</span>
                </div>
              )}

              {lines.map((line, li) => {
                const cost = parseFloat(line.cost) || 0;
                const totalQty = line.variants.reduce((s, v) => s + v.quantity, 0);
                const lineTotal = totalQty * cost;
                return (
                  <div key={li} className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-surface-container-high border-b border-outline-variant/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("purchaseOrder.line")} {li + 1}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                          line.is_new_product
                            ? "bg-[#d99c00]/10 text-[#d99c00] border-[#d99c00]/20"
                            : "bg-secondary/10 text-secondary border-secondary/20"
                        }`}>
                          {line.is_new_product ? t("receipt.newProduct") : t("receipt.existing")}
                        </span>
                        {line.is_variant_group && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">{t("product.variants")}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-5">
                      {/* ════════════════════════════════════════ */}
                      {/* SECTION 1: Product Identity            */}
                      {/* ════════════════════════════════════════ */}
                      <FormSection title={t("receipt.productIdentity")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label={`${t("purchaseOrder.productName")} *`}>
                            <input
                              value={line.product_name}
                              onChange={(e) => updateLine(li, { product_name: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                              placeholder={t("purchaseOrder.productNamePlaceholder")}
                            />
                          </Field>
                          <Field label={t("receipt.rawName")}>
                            <input
                              value={line.raw_name}
                              onChange={(e) => updateLine(li, { raw_name: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                              placeholder={t("receipt.rawNamePlaceholder")}
                            />
                          </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label={t("receipt.matchedProductId")}>
                            <input
                              value={line.matched_product_id ?? ""}
                              onChange={(e) => updateLine(li, { matched_product_id: e.target.value || null })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-mono text-[11px]"
                              placeholder={t("receipt.nullPlaceholder")}
                            />
                          </Field>
                          <Field label={t("purchaseOrder.hasVariants")}>
                            <label className="flex items-center gap-2 h-9 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={line.is_variant_group}
                                onChange={(e) => updateLine(li, { is_variant_group: e.target.checked })}
                                className="w-4 h-4 rounded border-outline/50 bg-surface-container-high text-primary focus:border-primary"
                              />
                              <span className="text-sm text-on-surface-variant">
                                {line.is_variant_group ? t("receipt.yesHasVariants") : t("receipt.noSingleProduct")}
                              </span>
                            </label>
                          </Field>
                        </div>
                        <Field label={t("common.description")}>
                          <input
                            value={line.description}
                            onChange={(e) => updateLine(li, { description: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                            placeholder={t("purchaseOrder.descriptionPlaceholder")}
                          />
                        </Field>
                      </FormSection>

                      {/* ════════════════════════════════════════ */}
                      {/* SECTION 2: Stock & Variants             */}
                      {/* ════════════════════════════════════════ */}
                      <FormSection title={t("receipt.stockReceived")}>
                        <VariantEditor
                          variants={line.variants}
                          onUpdate={(variants) => updateVariant(li, variants)}
                        />

                        <div className="flex justify-end text-[11px] text-outline font-data-table border-t border-outline-variant/30 pt-2">
                          {totalQty} {t("receipt.unit", { count: totalQty })} {formatCurrency(cost)} {t("receipt.each")} = {formatCurrency(lineTotal)}
                        </div>
                      </FormSection>

                      {/* ════════════════════════════════════════ */}
                      {/* SECTION 3: Product Pricing              */}
                      {/* ════════════════════════════════════════ */}
                      <FormSection title={t("receipt.productPricing")}>
                        <p className="text-[10px] text-outline italic mb-2">
                          {t("receipt.pricingHint")}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Field label={`${t("purchaseOrder.sellingPrice")} *`}>
                            <input
                              type="number" step="0.01" min="0"
                              value={line.price}
                              onChange={(e) => updateLine(li, { price: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                              placeholder={t("purchaseOrder.pricePlaceholder")}
                            />
                          </Field>
                          <Field label={t("receipt.costPerUnit")}>
                            <input
                              type="number" step="0.01" min="0"
                              value={line.cost}
                              onChange={(e) => updateLine(li, { cost: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                              placeholder={t("purchaseOrder.pricePlaceholder")}
                            />
                          </Field>
                          <Field label={t("purchaseOrder.lowStockThreshold")}>
                            <input
                              type="number" min="0"
                              value={line.low_stock_threshold}
                              onChange={(e) => updateLine(li, { low_stock_threshold: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                              placeholder={t("purchaseOrder.lowStockPlaceholder")}
                            />
                          </Field>
                          <Field label={t("purchaseOrder.category")}>
                            <SearchableSelect
                              items={categories}
                              value={line.category_id}
                              onChange={(id) => updateLine(li, { category_id: id })}
                              placeholder={t("purchaseOrder.selectCategory")}
                              loading={catLoading}
                              error={catError || undefined}
                            />
                          </Field>
                        </div>
                      </FormSection>

                      {/* ════════════════════════════════════════ */}
                      {/* SECTION 4: Classification & Notes       */}
                      {/* ════════════════════════════════════════ */}
                      <FormSection title={t("receipt.classificationNotes")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label={t("purchaseOrder.discount")}>
                            <SearchableSelect
                              items={discounts.map((d) => ({ id: d.id, name: `${d.name} (${d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value} ${t("common.currencySymbol")}`})` }))}
                              value={line.discount_id}
                              onChange={(id) => updateLine(li, { discount_id: id })}
                              placeholder={t("purchaseOrder.noDiscount")}
                              loading={discLoading}
                              error={discError || undefined}
                            />
                          </Field>
                          <Field label={t("purchaseOrder.internalNotes")}>
                            <input
                              value={line.internal_notes}
                              onChange={(e) => updateLine(li, { internal_notes: e.target.value })}
                              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                              placeholder={t("receipt.internalNotesPlaceholder")}
                            />
                          </Field>
                        </div>
                      </FormSection>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end text-sm font-bold text-on-surface font-data-table border-t border-outline-variant pt-3">
                {t("receipt.grandTotal")}: {formatCurrency(liveTotal)}
              </div>

              {/* ── Bill Metadata ── */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-surface-container-high border-b border-outline-variant/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("receipt.billDetails")}</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label={t("vendorBill.reference")}>
                      <input
                        value={billReference}
                        onChange={(e) => onUpdate({ billReference: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary"
                        placeholder={t("purchaseOrder.billRefPlaceholder")}
                      />
                    </Field>
                    <Field label={t("vendorBill.dueDate")}>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => onUpdate({ dueDate: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary"
                      />
                    </Field>
                    <Field label={t("vendorBill.notes")}>
                      <input
                        value={notes}
                        onChange={(e) => onUpdate({ notes: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary"
                        placeholder={t("purchaseOrder.notesPlaceholder")}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-sm text-error">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 md:px-6 py-4 border-t border-outline-variant flex flex-col items-end gap-2">
              <p className="text-xs text-on-surface-variant">
                {t("receipt.willCreateBill")} ${liveTotal.toFixed(2)}
                {liveNewProductCount > 0 && `${t("receipt.andAdd")} ${liveNewProductCount} ${t("receipt.newProduct", { count: liveNewProductCount })}`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={confirming}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20"
                >
                  {lines.length > 0 ? t("receipt.saveAndClose") : t("common.cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!allVariantsValid || confirming}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      {t("receipt.confirming")}
                    </>
                  ) : (
                    t("receipt.confirmReceipt")
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
