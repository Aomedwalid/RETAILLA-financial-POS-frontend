"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { PricingResult } from "../types";

interface PricingSummaryProps {
  pricing: PricingResult | null;
  promoCode: string | null;
}

function safeParse(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

export default function PricingSummary({ pricing, promoCode }: PricingSummaryProps) {
  const { t } = useTranslation();
  if (!pricing) return null;

  const productDiscount = safeParse(pricing.total_product_discount);
  const promoDiscount = safeParse(pricing.total_promo_discount);
  const totalDiscount = (productDiscount + promoDiscount).toFixed(2);
  const hasProductDiscount = productDiscount > 0;
  const hasPromoDiscount = promoDiscount > 0;
  const hasAnyDiscount = safeParse(totalDiscount) > 0;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-xs font-medium text-on-surface-variant">
        <span>{t("pos.pricing.subtotal")}</span>
        <span className="font-data-table">{formatCurrency(pricing.subtotal)}</span>
      </div>
      {hasProductDiscount && (
        <div className="flex justify-between text-xs font-medium text-on-surface-variant">
          <span>{t("pos.discount")}</span>
          <span className="font-data-table">-{formatCurrency(pricing.total_product_discount)}</span>
        </div>
      )}
      {hasPromoDiscount && promoCode && (
        <div className="flex justify-between text-xs font-medium text-secondary">
          <span>{t("pos.promoCode")} ({promoCode})</span>
          <span className="font-data-table">-{formatCurrency(pricing.total_promo_discount)}</span>
        </div>
      )}
      {hasAnyDiscount && (
        <div className="flex justify-between text-xs font-medium text-on-surface-variant">
          <span>{t("pos.pricing.discount")}</span>
          <span className="font-data-table">-{formatCurrency(totalDiscount)}</span>
        </div>
      )}
      <div className="pt-3 border-t border-outline-variant flex justify-between items-end">
        <span className="font-headline-sm text-headline-sm">{t("pos.pricing.grandTotal")}</span>
        <span className="font-data-table text-2xl font-bold text-primary">{formatCurrency(pricing.grand_total)}</span>
      </div>
    </div>
  );
}
