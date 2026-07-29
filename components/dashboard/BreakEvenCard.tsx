"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatCurrency } from "@/lib/format";

const LOOKBACK_OPTIONS = [
  { labelKey: "date.lookback.30d", value: 30 },
  { labelKey: "date.lookback.90d", value: 90 },
  { labelKey: "date.lookback.180d", value: 180 },
];

export default function BreakEvenCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [lookback, setLookback] = useState(30);
  const { data, isLoading, error } = useQuery({
    queryKey: ["breakEven", lookback],
    queryFn: () => reportsApi.breakEven(lookback),
    enabled: !!accessToken,
  });

  const dailyFixed = parseFloat(data?.avg_daily_fixed_costs ?? "0");
  const marginPct = parseFloat(data?.avg_margin_pct ?? "0");
  const beRevenue = data?.break_even_daily_revenue != null
    ? parseFloat(data.break_even_daily_revenue)
    : null;
  const hasBeData = dailyFixed > 0 && marginPct > 0 && beRevenue != null;

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-32 rounded bg-surface-container-highest/60 mb-8" />
        <div className="space-y-4">
          <div className="h-10 w-36 rounded bg-surface-container-highest/60" />
          <div className="h-3 w-48 rounded bg-surface-container-highest/40" />
          <div className="h-3 w-40 rounded bg-surface-container-highest/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.breakEven")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("common.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <div className="flex items-center justify-between mb-6">
        <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.breakEven")}</p>
        <div className="bg-surface-container-highest p-1 rounded-lg flex gap-1">
          {LOOKBACK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLookback(opt.value)}
              className={
                lookback === opt.value
                  ? "px-3 py-1 rounded-md bg-surface-container-low text-xs font-bold text-primary shadow-sm"
                  : "px-3 py-1 rounded-md text-xs font-bold text-on-surface-variant hover:text-primary"
              }
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs text-on-surface-variant mb-1">{t("dashboard.dailyRevenueNeeded")}</p>
          <p className="text-3xl font-bold font-data-table text-on-surface">
            {hasBeData ? `${formatCurrency(beRevenue!)}/${t("common.day")}` : "—"}
          </p>
          {!hasBeData && (
            <p className="text-[10px] text-on-surface-variant mt-1">{t("dashboard.insufficientData")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
          <div>
            <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{t("dashboard.avgDailyFixedCosts")}</p>
            <p className="font-data-table text-sm text-primary mt-0.5">{formatCurrency(dailyFixed)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{t("dashboard.avgMargin")}</p>
            <p className="font-data-table text-sm text-secondary mt-0.5">{marginPct.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            {t("dashboard.breakEvenDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
