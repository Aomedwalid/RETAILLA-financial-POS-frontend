"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { discountsApi } from "../api";
import type { Discount } from "../types";
import { formatCurrency } from "@/lib/format";

interface DiscountDetailsModalProps {
  discountId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function DiscountDetailsModal({
  discountId,
  onClose,
  onEdit,
}: DiscountDetailsModalProps) {
  const { t } = useTranslation();
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    discountsApi
      .get(discountId)
      .then((d) => { if (!cancelled) setDiscount(d); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [discountId]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("discount.editDiscountCaption")}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 w-full bg-surface-variant/20 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          ) : discount ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.name")}</p>
                  <p className="text-sm text-on-surface font-medium">{discount.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.type")}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {discount.type === "PERCENTAGE" ? t("common.percent") : t("common.price")}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.totalDiscount")}</p>
                  <p className="text-sm font-data-table text-primary">
                    {discount.type === "PERCENTAGE" ? `${Number(discount.value).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : formatCurrency(discount.value)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("pos.maxDiscountAmount")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {discount.max_discount_amount ? formatCurrency(discount.max_discount_amount) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.status")}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${discount.active ? "bg-secondary" : "bg-outline"}`} />
                    <span className="text-sm">{discount.active ? t("common.active") : t("common.inactive")}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.quantity")}</p>
                  <p className="text-sm text-on-surface">{discount.products_affected}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.date")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(discount.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("customer.updatedAt")}</p>
                  <p className="text-sm text-on-surface-variant">
                    {new Date(discount.updated_at).toLocaleDateString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Usage Summary */}
              <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                  <h4 className="font-headline-sm text-headline-sm text-sm text-on-surface">{t("discount.effectiveness")}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.usageLimit")}</p>
                    <p className="text-lg font-bold text-on-surface">{discount.times_used}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("discount.ordersAffected")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("common.quantity")}</p>
                    <p className="text-lg font-bold text-on-surface">{discount.products_affected}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("discount.ordersAffected")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.totalDiscountGiven")}</p>
                    <p className="text-lg font-bold text-secondary">{formatCurrency(discount.total_saved)}</p>
                    <p className="text-[11px] text-on-surface-variant">{t("discount.totalDiscountGiven")}</p>
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
            {t("common.close")}
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all"
          >
            {t("discount.editDiscountCaption")}
          </button>
        </div>
      </div>
    </div>
  );
}
