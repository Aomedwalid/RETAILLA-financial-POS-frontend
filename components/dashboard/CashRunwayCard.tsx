"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "react-i18next";

const LOOKBACK_OPTIONS = [
  { labelKey: "date.lookback.30d", value: 30 },
  { labelKey: "date.lookback.90d", value: 90 },
  { labelKey: "date.lookback.180d", value: 180 },
];

export default function CashRunwayCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [lookback, setLookback] = useState(90);
  const { data, isLoading, error } = useQuery({
    queryKey: ["runway", lookback],
    queryFn: () => reportsApi.runway(lookback),
    enabled: !!accessToken,
  });

  const opCash = parseFloat(data?.operating_cash ?? "0");
  const avgBurn = parseFloat(data?.avg_daily_burn ?? "0");
  const runwayDays = data?.runway_days != null ? parseFloat(data.runway_days) : avgBurn > 0 ? opCash / avgBurn : 252;
  const runwayMonths = runwayDays / 30;

  const barPct = Math.min((runwayDays / 365) * 100, 100);

  let barColor = "bg-secondary";
  if (runwayMonths < 3) barColor = "bg-error";
  else if (runwayMonths < 6) barColor = "bg-tertiary";

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-36 rounded bg-surface-container-highest/60 mb-1" />
        <div className="h-7 w-28 rounded bg-surface-container-highest/60 mb-8" />
        <div className="flex gap-1 mb-8">
          <div className="h-7 w-12 rounded bg-surface-container-highest/60" />
          <div className="h-7 w-12 rounded bg-surface-container-highest/60" />
          <div className="h-7 w-12 rounded bg-surface-container-highest/60" />
        </div>
        <div className="h-4 w-full rounded-full bg-surface-container-highest/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <p className="text-label-caps text-on-surface-variant uppercase mb-1">{t("dashboard.cashRunway.title")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("common.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-label-caps text-on-surface-variant uppercase mb-1">
            {t("dashboard.cashRunway.title")}
          </p>
          <p className="text-headline-md font-bold text-primary">
            {runwayMonths.toLocaleString("ar-EG", { maximumFractionDigits: 1 })} {t("dashboard.cashRunway.months")}
          </p>
        </div>
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

      <div className="space-y-8 mt-12">
        <div className="relative h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`absolute top-0 end-0 h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${barPct}%` }}
          />
          <div className="absolute top-0 end-[25%] h-full w-px bg-on-background/20" />
          <div className="absolute top-0 end-[50%] h-full w-px bg-on-background/20" />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
          <span className="text-error">{t("dashboard.cashRunway.critical")}</span>
          <span className="text-tertiary">{t("dashboard.cashRunway.stability")}</span>
          <span className="text-secondary">{t("dashboard.cashRunway.growth")}</span>
        </div>
      </div>

      <div className="mt-12 p-4 rounded-lg bg-surface-container-low border border-outline-variant flex items-center gap-4">
        <span className="material-symbols-outlined text-secondary">verified</span>
        <p className="text-sm text-on-surface">
          {t("dashboard.cashRunway.extended", { months: "١٫٢", month: "أكتوبر" })}
        </p>
      </div>
    </div>
  );
}
