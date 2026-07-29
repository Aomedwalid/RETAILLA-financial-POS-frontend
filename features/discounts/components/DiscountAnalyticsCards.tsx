"use client";

import { useDateRange } from "@/lib/filters/DateRangeContext";
import { useDiscountOverview } from "../hooks";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  return 0;
}

function fmtNum(n: number) {
  return n.toLocaleString("ar-EG");
}

export default function DiscountAnalyticsCards() {
  const { t } = useTranslation();
  const { startDate, endDate } = useDateRange();
  const { data, isLoading: loading } = useDiscountOverview({ start_date: startDate, end_date: endDate });

  const topPromos = data?.promo_breakdown
    ?.filter((p) => p.times_used > 0)
    .sort((a, b) => b.times_used - a.times_used)
    .slice(0, 5) ?? [];

  const topDiscounts = data?.discount_breakdown
    ?.filter((d) => d.times_used > 0)
    .sort((a, b) => b.times_used - a.times_used)
    .slice(0, 5) ?? [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-container-low rounded-xl border border-outline-variant animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-2">
          <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.analytics.ordersWithDiscounts")}</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">{fmtNum(data.total_orders_with_discounts)}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-2">
          <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.analytics.totalDiscounted")}</p>
          <p className="font-headline-sm text-headline-sm text-primary">{formatCurrency(data.total_discount_amount)}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-2">
          <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.analytics.productDiscounts")}</p>
          <p className="font-headline-sm text-headline-sm text-primary">{formatCurrency(data.total_product_discount_amount)}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-2">
          <p className="font-label-caps text-[10px] text-outline tracking-wider">{t("discount.analytics.promoDiscounts")}</p>
          <p className="font-headline-sm text-headline-sm text-secondary">{formatCurrency(data.total_promo_discount_amount)}</p>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top promo codes */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-card-padding py-3 border-b border-outline-variant">
            <h4 className="font-label-caps text-label-caps text-on-surface">{t("discount.analytics.topPromoCodes")}</h4>
          </div>
          {topPromos.length === 0 ? (
            <div className="px-card-padding py-8 text-center text-sm text-on-surface-variant">
              {t("discount.analytics.noPromoData")}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/30 border-b border-outline-variant">
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline">{t("discount.analytics.code")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.used")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.products")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.saved")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {topPromos.map((p) => (
                  <tr key={p.promo_id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-card-padding py-2.5">
                      <span className="font-data-table text-[13px] text-primary">{p.code}</span>
                    </td>
                    <td className="px-card-padding py-2.5 text-right text-sm text-on-surface">{fmtNum(p.times_used)}</td>
                    <td className="px-card-padding py-2.5 text-right text-sm text-on-surface-variant">{fmtNum(p.products_affected)}</td>
                    <td className="px-card-padding py-2.5 text-right text-sm font-medium text-secondary">{formatCurrency(p.total_saved)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top discount rules */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-card-padding py-3 border-b border-outline-variant">
            <h4 className="font-label-caps text-label-caps text-on-surface">{t("discount.analytics.topDiscountRules")}</h4>
          </div>
          {topDiscounts.length === 0 ? (
            <div className="px-card-padding py-8 text-center text-sm text-on-surface-variant">
              {t("discount.analytics.noRuleData")}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/30 border-b border-outline-variant">
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline">{t("discount.analytics.name")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.used")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.products")}</th>
                  <th className="px-card-padding py-2 font-label-caps text-[10px] text-outline text-right">{t("discount.analytics.saved")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {topDiscounts.map((d) => (
                  <tr key={d.discount_id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-card-padding py-2.5">
                      <span className="text-sm text-on-surface font-medium">{d.name}</span>
                    </td>
                    <td className="px-card-padding py-2.5 text-right text-sm text-on-surface">{fmtNum(d.times_used)}</td>
                    <td className="px-card-padding py-2.5 text-right text-sm text-on-surface-variant">{fmtNum(d.products_affected)}</td>
                    <td className="px-card-padding py-2.5 text-right text-sm font-medium text-primary">{formatCurrency(d.total_saved)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
