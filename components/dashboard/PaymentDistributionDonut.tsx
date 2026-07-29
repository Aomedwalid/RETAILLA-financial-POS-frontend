"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

const PALLETTE = [
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-error",
  "text-tertiary-container",
  "text-secondary-fixed-dim",
  "text-primary-fixed-dim",
];

const PALLETTE_STROKE = [
  "#acc7ff",
  "#49dfa2",
  "#c3c6d5",
  "#ffb4ab",
  "#8d909f",
  "#6bfcbd",
  "#acc7ff",
];

function label(method: string, t: (key: string) => string) {
  const key = `paymentMethod.${method}`;
  const result = t(key);
  return result !== key ? result : method;
}

export default function PaymentDistributionDonut() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ["paymentMethods", startDate, endDate],
    queryFn: () => reportsApi.paymentMethods({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  const items = (Array.isArray(data) && data.length > 0
    ? data.map((d) => ({
        method: d.payment_method,
        amount: parseFloat(String(d.total_amount)),
        count: d.transaction_count,
      }))
    : [
        { method: "CASH", amount: 0, count: 0 },
        { method: "DIGITAL", amount: 0, count: 0 },
      ]
  ).map((i, idx) => ({ ...i, color: PALLETTE[idx % PALLETTE.length], stroke: PALLETTE_STROKE[idx % PALLETTE_STROKE.length] }));

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalCount = items.reduce((s, i) => s + i.count, 0);
  const percentages = items.map((i) => (totalAmount > 0 ? (i.amount / totalAmount) * 100 : 0));

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-48 rounded bg-surface-container-highest/60 mb-8" />
        <div className="flex items-center gap-8">
          <div className="w-40 h-40 rounded-full bg-surface-container-highest/40" />
          <div className="flex-1 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded bg-surface-container-highest/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <p className="text-label-caps text-on-surface-variant uppercase mb-8">{t("dashboard.paymentDistribution.title")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("common.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <p className="text-label-caps text-on-surface-variant uppercase mb-6">
        {t("dashboard.paymentDistribution.title")}
      </p>

      {/* Donut + mini legend */}
      <div className="flex items-center gap-8 mb-6">
        <div className="w-40 h-40 relative flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {percentages.map((pct, i) => {
              const offset = cumulative;
              cumulative += pct;
              return (
                <path
                  key={items[i].method}
                  fill="none"
                  stroke={items[i].stroke}
                  strokeDasharray={`${Math.max(pct, 0.5).toFixed(0)}, 100`}
                  strokeDashoffset={offset > 0 ? `-${offset.toFixed(0)}` : "0"}
                  strokeWidth="4"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-on-surface-variant">{t("dashboard.paymentDistribution.total")}</p>
            <p className="font-data-table text-sm">{totalCount.toLocaleString("ar-EG")} {t("dashboard.paymentDistribution.transactions")}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {items.map((i, idx) => (
            <div key={i.method} className="bg-surface-container-low rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${i.color}`} />
                  <span className="text-sm font-medium">{label(i.method, t)}</span>
                </div>
                <span className="font-data-table text-sm">{percentages[idx].toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant ml-5">
                <span>{formatCurrency(i.amount)}</span>
                <span>{i.count} {t("dashboard.paymentDistribution.transactions")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="border-t border-outline-variant/20 pt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{t("dashboard.paymentDistribution.totalRevenue")}</p>
          <p className="font-data-table text-sm text-on-surface">{formatCurrency(totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{t("dashboard.paymentDistribution.transactions")}</p>
          <p className="font-data-table text-sm text-on-surface">{totalCount.toLocaleString("ar-EG")}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{t("dashboard.paymentDistribution.avgPerTxn")}</p>
          <p className="font-data-table text-sm text-on-surface">{totalCount > 0 ? formatCurrency(totalAmount / totalCount) : "٠٫٠٠ ج.م"}</p>
        </div>
      </div>
    </div>
  );
}
