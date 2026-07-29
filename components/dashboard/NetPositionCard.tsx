"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

export default function NetPositionCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ["netPosition", startDate, endDate],
    queryFn: () => reportsApi.netPosition({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  const netPos = data?.net_position ?? 2105443.0;
  const accountsPayable = data?.total_expenses ?? 842100;
  const accountsReceivable = data?.total_sales ?? 2900000;

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between min-h-[180px] animate-pulse">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-surface-container-highest/60" />
            <div className="h-4 w-4 rounded bg-surface-container-highest/60" />
          </div>
          <div className="h-7 w-36 rounded bg-surface-container-highest/60" />
          <div className="h-5 w-28 rounded bg-surface-container-highest/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between min-h-[180px]">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xs text-on-surface-variant">{t("dashboard.netPosition.failed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.netPosition.title")}</p>
          <span className="material-symbols-outlined text-outline">info</span>
        </div>
        <h3 className="font-headline-md text-headline-md font-data-table mb-2">
          {formatCurrency(netPos)}
        </h3>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant">{t("dashboard.netPosition.q4Delta")}</span>
          <span className="text-[10px] font-bold text-secondary">{t("dashboard.netPosition.deltaValue", { value: "٢٤٤٬٠٠٠" })}</span>
        </div>
      </div>
      <div className="mt-8 border-t border-outline-variant/30 pt-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-on-surface-variant">{t("dashboard.netPosition.accountsPayable")}</p>
            <p className="font-data-table text-sm">{formatCurrency(accountsPayable)}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-on-surface-variant">{t("dashboard.netPosition.accountsReceivable")}</p>
            <p className="font-data-table text-sm">{formatCurrency(accountsReceivable)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
