"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { ordersApi } from "@/features/orders/api";
import { productsApi } from "@/features/products/api";
import type { Order, OrderLineItem } from "@/features/orders/types";

interface LineRefundState {
  quantity: number;
  reason: string;
}

interface RefundModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ order, onClose, onSuccess }: RefundModalProps) {
  const { t } = useTranslation();
  const [lineStates, setLineStates] = useState<Record<string, LineRefundState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [variantAttrMap, setVariantAttrMap] = useState<Map<string, Record<string, string | number | boolean>>>(new Map());

  const lineItems = useMemo(() => order.line_items || [], [order.line_items]);

  const lineKey = lineItems.map((item) => item.id || "").join("|");
  const [prevLineKey, setPrevLineKey] = useState(lineKey);
  if (prevLineKey !== lineKey) {
    setPrevLineKey(lineKey);
    const initial: Record<string, LineRefundState> = {};
    for (const item of lineItems) {
      if (item.id) {
        initial[item.id] = { quantity: 0, reason: "" };
      }
    }
    setLineStates(initial);
  }

  useEffect(() => {
    const needsAttrs = lineItems.some((item) => item.variant_id && !item.variant_name);
    if (!needsAttrs) return;
    let cancelled = false;
    productsApi.list({ size: 100, page: 1 })
      .then(async (firstPage) => {
        const allItems = [...firstPage.items];
        if (firstPage.pages > 1) {
          const rest = await Promise.all(
            Array.from({ length: firstPage.pages - 1 }, (_, i) => productsApi.list({ size: 100, page: i + 2 }))
          );
          rest.forEach((pg) => allItems.push(...pg.items));
        }
        if (cancelled) return;
        const map = new Map<string, Record<string, string | number | boolean>>();
        for (const prod of allItems) {
          for (const variant of prod.variants) {
            if (variant.attributes && Object.keys(variant.attributes).length > 0) {
              map.set(variant.id, variant.attributes);
            }
          }
        }
        setVariantAttrMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lineItems]);

  const updateLine = useCallback((id: string, updates: Partial<LineRefundState>) => {
    setLineStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, []);

  const totalRefund = useMemo(() => {
    let total = 0;
    for (const item of lineItems) {
      if (!item.id) continue;
      const state = lineStates[item.id];
      if (state && state.quantity > 0) {
        const pricePerUnit = item.net_price ? parseFloat(item.net_price) : parseFloat(item.final_price);
        total += state.quantity * pricePerUnit;
      }
    }
    return total;
  }, [lineStates, lineItems]);

  const selectedCount = useMemo(() => {
    return Object.values(lineStates).filter((s) => s.quantity > 0).length;
  }, [lineStates]);

  const hasValidSelection = selectedCount > 0 && totalRefund > 0;

  async function handleSubmit() {
    const lines = Object.entries(lineStates)
      .filter(([, state]) => state.quantity > 0)
      .map(([id, state]) => ({
        order_line_item_id: id,
        quantity: state.quantity,
        ...(state.reason.trim() ? { reason: state.reason.trim() } : {}),
      }));

    if (lines.length === 0) {
      setError(t("validation.required"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await ordersApi.createRefund(order.id, {
        order_id: order.id,
        lines,
      });
      const refunded = result.refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount), 0);
      setTotalRefunded(refunded);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pos.refundError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px] text-secondary">check_circle</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-secondary mb-2">{t("common.success")}</h3>
            <p className="text-sm text-on-surface-variant mb-1">
              {t("pos.orderId")} <span className="font-data-table text-on-surface">#{order.id.slice(0, 8)}</span>
            </p>
            <p className="font-data-table text-2xl font-bold text-primary mb-6">
              {formatCurrency(totalRefunded)}
            </p>
            <button
              onClick={onSuccess}
              className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold active:scale-95 transition-transform"
            >
              {t("common.done")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-outline-variant bg-surface-container flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-xl">currency_exchange</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{t("pos.refund")}</h3>
              <p className="text-xs text-on-surface-variant font-data-table truncate">#{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {/* Refund Instructions */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
            <div>
              <p className="text-xs text-on-surface font-semibold">{t("pos.items")}</p>
              <p className="text-[11px] text-on-surface-variant">{t("common.somethingWentWrong")}</p>
            </div>
          </div>

          {/* Line Items Table */}
          {lineItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-on-surface-variant">{t("pos.noProducts")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item) => {
                if (!item.id) return null;
                const state = lineStates[item.id] || { quantity: 0, reason: "" };
                const alreadyRefunded = item.refunded_quantity ?? 0;
                const maxRefund = item.quantity - alreadyRefunded;
                const pricePerUnit = item.net_price ? parseFloat(item.net_price) : parseFloat(item.final_price);
                const lineTotal = pricePerUnit * state.quantity;
                const attrs = item.variant_id ? variantAttrMap.get(item.variant_id) : undefined;
                const variantLabel = item.variant_name || (attrs && Object.keys(attrs).length > 0 ? Object.values(attrs).join(" / ") : null);

                return (
                  <div key={item.id} className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                    <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <p className="text-sm font-semibold text-on-surface truncate">{item.product_name || t("product.title")}</p>
                            {variantLabel && <span className="text-xs text-on-surface-variant shrink-0 truncate">— {variantLabel}</span>}
                          </div>
                          {alreadyRefunded > 0 && (
                            <p className="text-[11px] text-error font-medium mt-1">{alreadyRefunded}/{item.quantity} {t("pos.refunded")}</p>
                          )}
                        </div>
                        <span className="font-data-table text-sm text-primary shrink-0">{formatCurrency(item.final_price)}</span>
                      </div>

                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      {/* Quantity Input */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-outline font-medium">{t("pos.quantity")}:</span>
                        <div className="flex items-center gap-1 bg-surface-container-highest border border-outline-variant rounded-lg px-1">
                          <button
                            onClick={() => updateLine(item.id!, { quantity: Math.max(0, state.quantity - 1) })}
                            disabled={state.quantity <= 0}
                            className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="w-10 text-center text-sm font-bold font-data-table text-on-surface">{state.quantity}</span>
                          <button
                            onClick={() => updateLine(item.id!, { quantity: Math.min(maxRefund, state.quantity + 1) })}
                            disabled={state.quantity >= maxRefund}
                            className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <span className="text-[11px] text-outline font-data-table">{t("common.of")} {maxRefund}</span>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <span className="font-data-table text-sm font-bold text-on-surface">
                          {state.quantity > 0 ? formatCurrency(lineTotal) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Reason Input (only show when qty > 0) */}
                    {state.quantity > 0 && (
                      <div className="mt-3 animate-fade-in">
                        <input
                          type="text"
                          value={state.reason}
                          onChange={(e) => updateLine(item.id!, { reason: e.target.value })}
                          placeholder={t("pos.refundReason")}
                          className="w-full bg-surface border border-outline-variant rounded-lg py-1.5 px-3 text-xs text-on-surface outline-none focus:border-primary placeholder:text-outline/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-outline-variant bg-surface-container space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant">{t("pos.refundAmount")}</p>
              <p className="font-data-table text-lg sm:text-xl font-bold text-primary">{formatCurrency(totalRefund)}</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasValidSelection || submitting}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-lg bg-error text-on-error font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-error/20"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">currency_exchange</span>
                    <span className="hidden sm:inline">{t("pos.processRefund")}</span>
                    <span className="sm:hidden">{t("pos.refund")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
