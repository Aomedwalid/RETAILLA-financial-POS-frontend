"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import DailySummaryModal from "./DailySummaryModal";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "react-i18next";

export default function DailySummaryChart() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dailySummary", startDate, endDate],
    queryFn: () => reportsApi.dailySummary({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  const items = Array.isArray(data) ? data : [];

  const totalSales = items.reduce((s, d) => s + (d.sales ?? 0), 0);
  const totalRefunds = items.reduce((s, d) => s + (d.refunds ?? 0), 0);
  const totalExpenses = items.reduce((s, d) => s + (d.expenses ?? 0), 0);
  const totalVendor = items.reduce((s, d) => s + (d.vendor_payments ?? 0), 0);
  const totalDraws = items.reduce((s, d) => s + (d.owner_draws ?? 0), 0);
  const totalContrib = items.reduce((s, d) => s + (d.owner_contributions ?? 0), 0);
  const totalAdj = items.reduce((s, d) => s + (d.adjustments ?? 0), 0);
  const netTotal = items.reduce((s, d) => s + (d.net_change ?? 0), 0);

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-48 rounded bg-surface-container-highest/60 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 rounded bg-surface-container-highest/40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <p className="text-label-caps text-on-surface-variant uppercase mb-6">{t("dashboard.dailySummary")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("common.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding overflow-hidden cursor-pointer transition-all hover:border-primary/30"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.dailySummary")}</p>
          <span className="text-[10px] text-primary font-bold uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            {t("dashboard.chart.expand")}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-on-surface-variant">{t("dashboard.chart.noData")}</p>
          </div>
        ) : (
          <div className="-mx-card-padding overflow-auto overscroll-x-contain max-h-[380px] custom-scrollbar">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="text-on-surface-variant uppercase tracking-wider text-[10px] border-b border-outline-variant/30 bg-surface">
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-start">{t("dashboard.chart.table.date")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.sales")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.refunds")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.expenses")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.vendorPmt")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.draws")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.contrib")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.adj")}</th>
                    <th className="sticky top-0 z-10 bg-surface px-card-padding py-2 font-bold text-end">{t("dashboard.chart.table.net")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.summary_date} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-card-padding py-2.5 font-medium text-on-surface whitespace-nowrap">
                        {formatDate(d.summary_date)}
                      </td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-primary">{formatCurrency(d.sales)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-error">{formatCurrency(d.refunds)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-error">{formatCurrency(d.expenses)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-error">{formatCurrency(d.vendor_payments)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-error">{formatCurrency(d.owner_draws)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-secondary">{formatCurrency(d.owner_contributions)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table text-on-surface">{formatCurrency(d.adjustments)}</td>
                      <td className="px-card-padding py-2.5 text-end font-data-table font-bold text-on-surface">{formatCurrency(d.net_change)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-outline-variant/40">
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 font-bold text-on-surface uppercase text-[10px]">{t("dashboard.chart.table.total")}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-primary">{formatCurrency(totalSales)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalRefunds)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalExpenses)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalVendor)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalDraws)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-secondary">{formatCurrency(totalContrib)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-on-surface">{formatCurrency(totalAdj)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-end font-data-table font-bold text-on-surface">{formatCurrency(netTotal)}</td>
                  </tr>
                </tfoot>
              </table>
          </div>
        )}
      </div>

      <DailySummaryModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
