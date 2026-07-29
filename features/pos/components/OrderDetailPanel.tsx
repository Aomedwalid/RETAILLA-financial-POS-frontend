"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ordersApi } from "@/features/orders/api";
import { productsApi } from "@/features/products/api";
import type { Order, OrderLineItem } from "@/features/orders/types";
import ProductDetailsModal from "@/features/products/components/ProductDetailsModal";

interface ProductInfo {
  name: string;
  product_id: string;
  variantAttributes?: Record<string, string | number | boolean>;
}

async function fetchAllProducts() {
  const map = new Map<string, ProductInfo>();
  const firstPage = await productsApi.list({ size: 100, page: 1 });
  const allItems = [...firstPage.items];
  const totalPages = firstPage.pages;
  for (let p = 2; p <= totalPages; p++) {
    const page = await productsApi.list({ size: 100, page: p });
    allItems.push(...page.items);
  }
  for (const prod of allItems) {
    for (const variant of prod.variants) {
      map.set(variant.id, { name: prod.name, product_id: prod.id, variantAttributes: variant.attributes });
    }
  }
  return map;
}

function LineItemRow({ item, onViewProduct, t }: { item: OrderLineItem & { variantAttributes?: Record<string, string | number | boolean> }; onViewProduct: (productId: string) => void; t: (key: string) => string }) {
  const hasRefunds = item.refunded_quantity != null && item.refunded_quantity > 0;
  const netPrice = item.net_price || item.final_price;
  const attrEntries = item.variantAttributes ? Object.entries(item.variantAttributes) : [];
  const variantLabel = item.variant_name || (attrEntries.length > 0 ? attrEntries.map(([, v]) => v).join(" / ") : null);

  return (
    <div className="bg-surface-container-low rounded-lg border border-outline-variant/60 px-3 sm:px-4 py-3">
      <div className="flex items-start sm:items-center justify-between mb-2 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <button
            onClick={() => onViewProduct(item.product_id || item.variant_id || "")}
            className="text-xs font-semibold text-on-surface truncate hover:text-primary transition-colors text-left"
            title={item.product_name || t("common.viewDetails")}
          >
            {item.product_name || t("product.title")}
          </button>
          {variantLabel && (
            <span className="text-[10px] text-on-surface-variant shrink-0">— {variantLabel}</span>
          )}
          {hasRefunds && (
            <span className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 border border-error/20 text-[10px] font-bold text-error">
              {item.refunded_quantity} / {item.quantity} {t("pos.refunded")}
            </span>
          )}
        </div>
        <span className="font-data-table text-xs text-primary shrink-0">{formatCurrency(netPrice)}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-center text-[10px] sm:text-[11px]">
        <div>
          <p className="text-outline mb-0.5">{t("pos.quantity")}</p>
          <p className="font-data-table text-on-surface">{item.quantity}</p>
        </div>
        <div>
          <p className="text-outline mb-0.5">{t("pos.price")}</p>
          <p className="font-data-table text-on-surface">{formatCurrency(item.unit_price)}</p>
        </div>
        <div>
          <p className="text-outline mb-0.5">{t("pos.discount")}</p>
          <p className="font-data-table text-error">
            {parseFloat(item.product_discount) > 0 || parseFloat(item.promo_discount) > 0
              ? formatCurrency(parseFloat(item.product_discount) + parseFloat(item.promo_discount))
              : "\u2014"}
          </p>
        </div>
        <div>
          <p className="text-outline mb-0.5">{t("pos.pricing.grandTotal")}</p>
          <p className="font-data-table text-primary">{formatCurrency(parseFloat(netPrice) * item.quantity)}</p>
        </div>
      </div>

      {hasRefunds && item.refunds && item.refunds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-outline-variant/40 space-y-1">
          <p className="text-[10px] text-outline font-medium">{t("pos.refund")}</p>
          {item.refunds.map((refund) => (
            <div key={refund.id} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-error">currency_exchange</span>
                <span className="text-on-surface-variant">
                  {refund.reason || t("common.none")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-outline">{t("pos.quantity")}: {refund.quantity}</span>
                <span className="font-data-table text-error">-{formatCurrency(refund.refund_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderDetailPanelProps {
  orderId: string;
  initialOrder: Order;
  onClose: () => void;
  onRefund: (order: Order) => void;
}

export default function OrderDetailPanel({ orderId, initialOrder, onClose, onRefund }: OrderDetailPanelProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productMap, setProductMap] = useState<Map<string, ProductInfo>>(new Map());
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    ordersApi.get(orderId)
      .then((full) => { if (!cancelled) setOrder(full); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : t("common.failedToLoad")); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    fetchAllProducts()
      .then((map) => { setProductMap(map); })
      .catch(() => {});
  }, []);

  const lineItems = order.line_items || [];
  const resolvedLineItems = lineItems.map((item) => {
    if (item.product_name) return item;
    const key = item.product_id || item.variant_id || "";
    const info = productMap.get(key);
    if (info) {
      return { ...item, product_name: info.name, product_id: info.product_id, variantAttributes: info.variantAttributes };
    }
    return item;
  });

  const payments = order.payments || [];
  const isCompleted = order.status === "COMPLETED";
  const isRefunded = order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED";

  const totalRefunded = lineItems.reduce((sum, item) => {
    if (item.refunded_amount) return sum + parseFloat(item.refunded_amount);
    return sum;
  }, 0);

  return (
    <>
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-5 py-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant shrink-0"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <div className="min-w-0">
            <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{t("pos.orderId")} #{order.id.slice(0, 8)}</h3>
            <p className="text-[11px] text-on-surface-variant font-data-table truncate">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4 sm:p-5 space-y-4 animate-pulse">
            <div className="h-5 w-32 rounded bg-surface-container-highest/60" />
            <div className="h-24 rounded-xl bg-surface-container-highest/60" />
            <div className="h-5 w-24 rounded bg-surface-container-highest/60" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-surface-container-highest/60" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 sm:p-5 text-center">
            <span className="material-symbols-outlined text-3xl text-error mb-2">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-5">
            {/* Status + Total */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <StatusBadge status={order.status} t={t} />
              <div className="text-right">
                <span className="font-data-table text-xl sm:text-2xl font-bold text-primary">{formatCurrency(order.total)}</span>
                {isRefunded && totalRefunded > 0 && (
                  <p className="text-[11px] text-error font-data-table">
                    {t("pos.refunded")}: {formatCurrency(totalRefunded)} &middot; {t("pos.pricing.grandTotal")}: {formatCurrency(parseFloat(order.total) - totalRefunded)}
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <section>
              <h4 className="text-label-caps font-label-caps text-primary mb-3 text-[10px]">{t("pos.orderDetails")}</h4>
              <div className="bg-surface-container-low rounded-xl border border-outline-variant p-3 sm:p-4 grid grid-cols-2 gap-y-3 gap-x-3 sm:gap-x-4">
                <DetailItem label={t("pos.pricing.subtotal")} value={formatCurrency(order.subtotal)} mono />
                {order.total_discount && parseFloat(order.total_discount) > 0 && (
                  <DetailItem label={t("pos.discountApplied")} value={formatCurrency(order.total_discount)} mono />
                )}
                {order.promo_code && <DetailItem label={t("pos.promoCode")} value={order.promo_code} />}
                {order.customer_id && <DetailItem label={t("customer.id")} value={order.customer_id.slice(0, 8) + "..."} mono />}
                <DetailItem label={t("pos.orderStatus")} value={order.status} />
              </div>
            </section>

            {/* Line Items */}
            {resolvedLineItems.length > 0 && (
              <section>
                <h4 className="text-label-caps font-label-caps text-primary mb-3 text-[10px]">{t("pos.items")} ({resolvedLineItems.length})</h4>
                <div className="space-y-2">
                  {resolvedLineItems.map((item, idx) => (
                    <LineItemRow key={item.id || idx} item={item} onViewProduct={(id) => setDetailProductId(id)} t={t} />
                  ))}
                </div>
              </section>
            )}

            {/* Payments */}
            {payments.length > 0 && (
              <section>
                <h4 className="text-label-caps font-label-caps text-primary mb-3 text-[10px]">{t("pos.paymentMethod")} ({payments.length})</h4>
                <div className="space-y-2">
                  {payments.map((p, idx) => (
                    <div key={p.id || idx} className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-sm text-primary">{p.payment_method === "CASH" ? "payments" : "confirmation_number"}</span>
                          {p.payment_method === "CASH" ? t("pos.cash") : t("pos.storeCredit")}
                        </span>
                        <span className="font-data-table text-sm text-primary">{formatCurrency(p.amount)}</span>
                      </div>
                      {p.payment_method === "CASH" && parseFloat(p.change_due) > 0 && (
                        <p className="text-[11px] text-on-surface-variant font-data-table pr-6">{t("pos.change")}: {formatCurrency(p.change_due)}</p>
                      )}
                      <p className="text-[10px] text-outline font-data-table pr-6 mt-0.5">{formatDateTime(p.created_at)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Refund Summary */}
            {isRefunded && totalRefunded > 0 && (
              <section>
                <h4 className="text-label-caps font-label-caps text-error mb-3 text-[10px]">{t("pos.refund")}</h4>
                <div className="bg-surface-container-low rounded-xl border border-error/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-sm">currency_exchange</span>
                      <span className="text-xs text-on-surface">{t("pos.refundAmount")}</span>
                    </div>
                    <span className="font-data-table text-sm font-bold text-error">{formatCurrency(totalRefunded)}</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-outline-variant bg-surface-container flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="px-3 sm:px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors text-sm font-medium"
        >
          {t("common.close")}
        </button>
        {isCompleted && (
          <button
            onClick={() => onRefund(order)}
            className="px-4 sm:px-5 py-2.5 rounded-lg bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-colors text-sm font-bold flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">currency_exchange</span>
            <span className="hidden sm:inline">{t("pos.refund")}</span>
          </button>
        )}
      </div>

      {/* Product Detail Modal */}
      {detailProductId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setDetailProductId(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <ProductDetailsModal
              productId={detailProductId}
              onClose={() => setDetailProductId(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  let color = "";
  let labelKey = "";
  if (status === "COMPLETED") { color = "bg-secondary/10 text-secondary border-secondary/20"; labelKey = "order.status.COMPLETED"; }
  else if (status === "REFUNDED") { color = "bg-error/10 text-error border-error/20"; labelKey = "order.status.REFUNDED"; }
  else if (status === "PARTIALLY_REFUNDED") { color = "bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20"; labelKey = "order.status.PARTIALLY_REFUNDED"; }
  else { color = "bg-outline/10 text-outline border-outline/20"; labelKey = status; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-data-table ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {t(labelKey)}
    </span>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-outline mb-0.5">{label}</p>
      <p className={`text-sm text-on-surface ${mono ? "font-data-table" : ""}`}>{value || "—"}</p>
    </div>
  );
}
