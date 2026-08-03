"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

const fmt = formatCurrency;

function cls(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type PnLRowProps = { label: string; value: string; tone: string; border: string; bold?: boolean };

function PnLRow({ label, value, tone, border, bold }: PnLRowProps) {
  return (
    <div className={cls("flex items-center justify-between gap-x-3 py-3 px-4 border-l-4", border)}>
      <span className={cls("text-sm text-on-surface-variant min-w-0", bold && "font-bold text-on-surface")}>{label}</span>
      <span className={cls("font-data-table text-sm font-bold shrink-0 whitespace-nowrap", tone)}>{value}</span>
    </div>
  );
}

export default function PnLCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();

  const { data: pnl, isLoading } = useQuery({
    queryKey: queryKeys.reports.profitAndLoss({ start_date: startDate, end_date: endDate }),
    queryFn: () => reportsApi.profitAndLoss({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse min-h-[200px]">
        <div className="h-3 w-24 rounded bg-surface-container-highest/60 mb-4" />
        <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
      </div>
    );
  }

  const netProfit = parseFloat(pnl?.net_profit ?? "0");

  const waterfallRows = [
    { label: t("stats.totalRevenue"), value: fmt(pnl?.gross_revenue), tone: "text-primary", border: "border-l-primary" },
    { label: t("dashboard.refunds"), value: fmt(pnl?.total_refunds), tone: "text-error", border: "border-l-error" },
    { label: t("report.netRevenue"), value: fmt(pnl?.net_revenue), tone: "text-secondary", border: "border-l-secondary", bold: true },
    { label: t("report.cogs"), value: fmt(pnl?.total_cogs), tone: "text-tertiary", border: "border-l-tertiary" },
    { label: t("report.operatingExpenses"), value: fmt(pnl?.total_operating_expenses), tone: "text-error", border: "border-l-error" },
    { label: t("dashboard.grossProfit"), value: fmt(pnl?.gross_profit), tone: "text-secondary", border: "border-l-secondary", bold: true },
  ];

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding h-full">
      <p className="text-label-caps text-on-surface-variant uppercase mb-2">{t("reports.pnl")}</p>
      <div className="divide-y divide-outline-variant/10">
        {waterfallRows.map((item) => (
          <PnLRow
            key={item.label}
            label={item.label}
            value={item.value}
            tone={item.tone}
            border={item.border}
            bold={item.bold}
          />
        ))}
        <div className={cls("flex items-center justify-between gap-x-3 py-3.5 px-4 border-l-4", netProfit >= 0 ? "border-l-secondary bg-secondary/10" : "border-l-error bg-error/10")}>
          <span className="text-sm font-bold text-on-surface min-w-0">{t("report.netProfit")}</span>
          <span className={cls("font-data-table text-base font-bold shrink-0 whitespace-nowrap", netProfit >= 0 ? "text-secondary" : "text-error")}>
            {fmt(pnl?.net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
}
