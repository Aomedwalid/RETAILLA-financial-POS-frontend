"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { PromoCode } from "../types";

function fmtPercent(v: unknown) {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

interface PromoCodeDetailsModalProps {
  promoCode: PromoCode;
  onClose: () => void;
  onEdit: () => void;
}

export default function PromoCodeDetailsModal({
  promoCode,
  onClose,
  onEdit,
}: PromoCodeDetailsModalProps) {
  const { t } = useTranslation();
  const isExpired = promoCode.expires_at ? new Date(promoCode.expires_at) < new Date() : false;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("promoCode.details")}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {promoCode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.code")}</p>
                  <p className="font-data-table text-data-table bg-surface-container-highest/50 px-2 py-1 rounded text-primary border border-outline-variant/50 inline-block">
                    {promoCode.code}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.type")}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {promoCode.type === "PERCENTAGE" ? t("discount.percentage") : t("discount.fixedAmount")}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.value")}</p>
                  <p className="text-sm font-data-table text-primary">
                    {promoCode.type === "PERCENTAGE" ? fmtPercent(promoCode.value) : formatCurrency(promoCode.value)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.maxDiscount")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {promoCode.max_discount_amount ? formatCurrency(promoCode.max_discount_amount) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.scope")}</p>
                  <p className="text-sm text-on-surface">
                    {promoCode.applies_to_all_products ? t("promoCode.allProducts") : t("promoCode.specificProducts", { count: promoCode.applicable_product_ids.length })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.status")}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-tighter border ${
                        promoCode.active
                          ? "bg-secondary/10 text-secondary border-secondary/20"
                          : "bg-outline/10 text-outline border-outline/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${promoCode.active ? "bg-secondary" : "bg-outline"}`} />
                      {promoCode.active ? t("promoCode.active") : t("promoCode.inactive")}
                    </span>
                    {promoCode.used && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-error/10 text-error border border-error/20">
                        {t("promoCode.used")}
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-error/10 text-error border border-error/20">
                        {t("promoCode.expired")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.expiry")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {promoCode.expires_at
                      ? new Date(promoCode.expires_at).toLocaleDateString("ar-EG", {
                          year: "numeric", month: "short", day: "numeric",
                        })
                      : t("promoCode.noExpiry")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.created")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(promoCode.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("promoCode.updated")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(promoCode.updated_at).toLocaleDateString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Usage Summary */}
              <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                  <h4 className="font-headline-sm text-headline-sm text-sm text-on-surface">{t("promoCode.usageSummary")}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">TIMES USED</p>
                    <p className="text-lg font-bold text-on-surface">{promoCode.times_used}</p>
                    <p className="text-[11px] text-on-surface-variant">Used in {promoCode.times_used} orders</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">PRODUCTS</p>
                    <p className="text-lg font-bold text-on-surface">{promoCode.products_affected}</p>
                    <p className="text-[11px] text-on-surface-variant">Applied to {promoCode.products_affected} line items</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">CUSTOMER SAVINGS</p>
                    <p className="text-lg font-bold text-secondary">{formatCurrency(promoCode.total_saved)}</p>
                    <p className="text-[11px] text-on-surface-variant">Total discount given</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="p-6 border-t border-outline-variant bg-surface-container flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all"
          >
            Edit Promo Code
          </button>
        </div>
      </div>
    </div>
  );
}
