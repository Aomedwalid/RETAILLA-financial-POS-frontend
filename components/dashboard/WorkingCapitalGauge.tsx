"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function WorkingCapitalGauge() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["workingCapital"],
    queryFn: () => reportsApi.workingCapital(),
    enabled: !!accessToken,
  });

  const receivable = parseFloat(data?.receivable_from_customers ?? "0");
  const payable = parseFloat(data?.payable_to_vendors ?? "0");
  const netWc = parseFloat(data?.net_working_capital ?? "0");
  const ratio = payable > 0 ? receivable / payable : 1.74;
  const total = receivable + payable;
  const receivablePct = total > 0 ? (receivable / total) * 100 : 65;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - receivablePct / 100);

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-40 rounded bg-surface-container-highest/60 mb-6" />
        <div className="flex items-center justify-center py-8">
          <div className="w-48 h-48 rounded-full bg-surface-container-highest/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <p className="text-label-caps text-on-surface-variant uppercase mb-6">{t("dashboard.workingCapital.title")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("common.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <p className="text-label-caps text-on-surface-variant uppercase mb-6">
        {t("dashboard.workingCapital.title")}
      </p>
      <div className="relative flex items-center justify-center py-8">
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 192 192">
          <circle
            className="text-surface-container-highest"
            cx="96"
            cy="96"
            fill="transparent"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
          />
          <circle
            className="text-secondary"
            cx="96"
            cy="96"
            fill="transparent"
            r="80"
            stroke="currentColor"
            strokeDasharray={String(circumference)}
            strokeDashoffset={String(offset)}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display-lg text-headline-md font-bold">{ratio.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-on-surface-variant">{t("dashboard.workingCapital.ratio")}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-medium">
        <span className="text-on-surface-variant">{t("dashboard.workingCapital.healthy")}</span>
        <span className="text-secondary">{t("dashboard.workingCapital.optimal")}</span>
      </div>
    </div>
  );
}
