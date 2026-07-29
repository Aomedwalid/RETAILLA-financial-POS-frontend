"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { productsApi } from "../api";
import type { ProductResponse, VariantResponse } from "../types";

interface ProductDetailsModalProps {
  productId: string;
  onClose: () => void;
}

export default function ProductDetailsModal({ productId, onClose }: ProductDetailsModalProps) {
  const { t } = useTranslation();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    productsApi.get(productId)
      .then(setProduct)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t("common.failedToLoad")))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-outline shrink-0">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight truncate">
                  {loading ? t("common.loading") : product?.name ?? t("product.details")}
                </h3>
                {product && product.is_low_stock && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-error/20 text-error">{t("product.lowStock")}</span>
                )}
              </div>
              {!loading && product && (
                <p className="text-[11px] text-outline font-data-table mt-0.5">{t("product.sku")}: {product.sku}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: "none" }}>
          {loading && (
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-3 w-16 rounded bg-surface-container-highest/60" />
                  <div className="h-5 w-3/4 rounded bg-surface-container-highest/60" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-error mb-3">error</span>
              <p className="text-body-md text-error">{error}</p>
              <button
                onClick={() => { setError(""); setLoading(true); productsApi.get(productId).then(setProduct).catch((err: unknown) => setError(err instanceof Error ? err.message : t("common.failedToLoad"))).finally(() => setLoading(false)); }}
                className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                {t("common.retry")}
              </button>
            </div>
          )}

          {product && !loading && (
            <>
              {/* Pricing & Stock Card */}
              <section className="bg-surface-container-low rounded-xl border border-outline-variant p-5 grid grid-cols-3 gap-y-5 gap-x-4">
                <Metric label={t("product.price")} value={formatCurrency(product.price)} color="text-primary" />
                <Metric label={t("product.priceActual")} value={formatCurrency(product.actual_price)} color="text-on-surface" />
                <Metric label={t("product.cost")} value={product.cost != null ? formatCurrency(product.cost) : "—"} color="text-on-surface" />
                <Metric
                  label={t("product.stock")}
                  value={String(product.stock_quantity)}
                  color={product.is_low_stock ? "text-error" : product.stock_quantity > product.low_stock_threshold * 2 ? "text-secondary" : "text-primary"}
                />
                <Metric label={t("product.sellCount")} value={String(product.sell_count)} color="text-on-surface" />
                <Metric label={t("product.lowStockThreshold")} value={String(product.low_stock_threshold)} color="text-on-surface" />
                <div className="col-span-3 flex items-center justify-center gap-4 pt-2 border-t border-outline-variant">
                  <div className="w-full max-w-xs bg-surface-variant rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        product.is_low_stock || product.stock_quantity <= product.low_stock_threshold ? "bg-error" :
                        product.stock_quantity <= product.low_stock_threshold * 2 ? "bg-primary" :
                        "bg-secondary"
                      }`}
                      style={{
                        width: `${Math.min(
                          (product.stock_quantity / Math.max(product.low_stock_threshold * 3, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ${
                    product.is_low_stock || product.stock_quantity <= product.low_stock_threshold ? "text-error" :
                    product.stock_quantity <= product.low_stock_threshold * 2 ? "text-primary" :
                    "text-secondary"
                  }`}>
                    {product.stock_quantity > 0
                      ? `${Math.round(Math.min((product.stock_quantity / Math.max(product.low_stock_threshold * 3, 1)) * 100, 100))}%`
                      : t("product.empty")}
                  </span>
                </div>
              </section>

              {/* Status Badges */}
              <section className="flex flex-wrap items-center gap-3">
                <Badge
                  label={t("product.lowStock")}
                  active={product.is_low_stock}
                  activeColor="bg-error/20 text-error"
                  inactiveColor="bg-surface-variant/30 text-on-surface-variant"
                />
                <Badge
                  label={t("product.variantsEnabled")}
                  active={product.variants_enabled === true}
                  activeColor="bg-primary/20 text-primary"
                  inactiveColor="bg-surface-variant/30 text-on-surface-variant"
                />
                <Badge
                  label={t("product.resolvedVariants")}
                  active={product.resolved_variants_enabled}
                  activeColor="bg-secondary/20 text-secondary"
                  inactiveColor="bg-surface-variant/30 text-on-surface-variant"
                />
              </section>

              {/* General Information */}
              <section>
                <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("product.basicInfo")}</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label={t("product.category")} value={product.category_name ?? "—"} />
                  <Field label={t("product.discountName")} value={product.discount_name ?? "—"} />
                  <Field label={t("product.discountType")} value={product.discount_type ?? "—"} />
                  <Field label={t("product.discountPercent")} value={product.discount_percent != null ? `${product.discount_percent}%` : "—"} />
                  <Field label={t("product.sku")} value={product.sku} mono />
                </div>
              </section>

              {/* Description */}
              {product.description && (
                <section>
                  <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("product.description")}</h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{product.description}</p>
                </section>
              )}

              {/* Variants */}
              {product.variants.length > 0 && (
                <section>
                  <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("product.variants")} ({product.variants.length})</h4>
                  <div className="space-y-3">
                    {product.variants.map((v: VariantResponse, idx: number) => (
                      <div key={v.id} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-on-surface">{t("product.variant")} #{idx + 1}</span>
                          <span className="text-[11px] text-outline font-data-table truncate mr-2" title={v.id}>{v.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(v.attributes).map(([key, val]) => (
                            <span key={key} className="bg-surface-variant/30 text-on-surface-variant px-2.5 py-1 rounded-full text-[11px]">
                              {key}: <span className="font-semibold text-on-surface">{String(val)}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-on-surface-variant">{t("product.stock")}:</span>
                          <span className="font-data-table text-on-surface">{v.stock_quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Internal Notes */}
              {product.internal_notes && (
                <section>
                  <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("product.internalNotes")}</h4>
                  <div className="bg-surface-container-low rounded-lg border border-outline-variant px-4 py-3">
                    <p className="text-body-md text-on-surface-variant">{product.internal_notes}</p>
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section className="border-t border-outline-variant pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("common.created")} value={formatDateTime(product.created_at)} />
                  <Field label={t("common.updated")} value={formatDateTime(product.updated_at)} />
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform">
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, active, activeColor, inactiveColor }: { label: string; active: boolean; activeColor: string; inactiveColor: string }) {
  const { t } = useTranslation();
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${active ? activeColor : inactiveColor}`}>
      {label}: {active ? t("common.yes") : t("common.no")}
    </span>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center min-w-0">
      <p className="text-label-caps font-label-caps text-outline mb-1 truncate">{label}</p>
      <p className={`font-headline-sm text-headline-sm leading-tight ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-label-caps font-label-caps text-outline mb-1">{label}</p>
      <p className={`text-body-md text-on-surface break-words ${mono ? "font-data-table" : ""}`}>{value}</p>
    </div>
  );
}
