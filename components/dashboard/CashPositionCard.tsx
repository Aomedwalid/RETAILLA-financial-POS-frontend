"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

export default function CashPositionCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ["cashPosition", startDate, endDate],
    queryFn: () => reportsApi.businessCashPosition({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  const cash = data?.business_cash_net ?? 4892120.45;
  const trend = 12.4;

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between overflow-hidden relative group min-h-[180px] animate-pulse">
        <div className="space-y-4">
          <div className="h-3 w-32 rounded bg-surface-container-highest/60" />
          <div className="h-8 w-48 rounded bg-surface-container-highest/60" />
        </div>
        <div className="mt-8 h-3 w-44 rounded bg-surface-container-highest/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between overflow-hidden relative group min-h-[180px]">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xs text-on-surface-variant">{t("dashboard.cashPosition.failed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between overflow-hidden relative group">
      <div>
        <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
          <div className="min-w-0">
            <p className="text-label-caps text-on-surface-variant uppercase mb-1">
              {t("dashboard.cashPosition.title")}
            </p>
            <h3 className="font-display-lg text-3xl sm:text-display-lg font-bold font-data-table break-words">
              {formatCurrency(cash)}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 shrink-0">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-bold">+{trend.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%</span>
          </div>
        </div>
        <div className="h-32 w-full"></div>
      </div>
      <p className="text-xs text-on-surface-variant mt-4">
        {t("dashboard.cashPosition.description")}
      </p>
    </div>
  );
}
