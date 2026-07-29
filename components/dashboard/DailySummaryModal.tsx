"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { presets } from "@/lib/filters/dateRangePresets";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const QUICK_PRESETS = [
  { labelKey: "dashboard.chart.presets.today", get: () => ({ start: todayStr(), end: todayStr() }) },
  { labelKey: "dashboard.chart.presets.yesterday", get: () => ({ start: daysAgoStr(1), end: daysAgoStr(1) }) },
  { labelKey: "dashboard.chart.presets.last7Days", get: () => ({ start: daysAgoStr(6), end: todayStr() }) },
  { labelKey: "dashboard.chart.presets.last30Days", get: () => ({ start: daysAgoStr(29), end: todayStr() }) },
  { labelKey: "dashboard.chart.presets.thisMonth", get: () => {
    const t = new Date();
    const first = new Date(t.getFullYear(), t.getMonth(), 1);
    const y1 = first.getFullYear();
    const m1 = String(first.getMonth() + 1).padStart(2, "0");
    const d1 = String(first.getDate()).padStart(2, "0");
    return { start: `${y1}-${m1}-${d1}`, end: todayStr() };
  }},
];

export default function DailySummaryModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [activePreset, setActivePreset] = useState("dashboard.chart.presets.today");

  const { data, isLoading } = useQuery({
    queryKey: ["dailySummaryModal", startDate, endDate],
    queryFn: () => reportsApi.dailySummary({ start_date: startDate, end_date: endDate }),
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

  function selectPreset(labelKey: string, start: string, end: string) {
    setActivePreset(labelKey);
    setStartDate(start);
    setEndDate(end);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-[95vw] max-w-6xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 shrink-0">
          <h2 className="text-headline-sm font-bold text-on-surface">{t("dashboard.dailySummary")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Period selector */}
        <div className="px-6 py-4 border-b border-outline-variant/10 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_PRESETS.map((p) => {
              const { start, end } = p.get();
              const isActive = activePreset === p.labelKey;
              return (
                <button
                  key={p.labelKey}
                  onClick={() => selectPreset(p.labelKey, start, end)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              );
            })}
            <div className="w-px h-6 bg-outline-variant/30 mx-1" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setActivePreset(""); }}
                className="h-8 px-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-xs outline-none focus:border-primary transition-colors"
              />
              <span className="text-xs text-on-surface-variant">{t("pagination.to")}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setActivePreset(""); }}
                className="h-8 px-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-xs outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">calendar_month</span>
              <p className="text-sm text-on-surface-variant">{t("dashboard.chart.noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-on-surface-variant uppercase tracking-wider text-[10px] border-b border-outline-variant/30">
                    <th className="text-start px-4 py-2.5 font-bold">{t("dashboard.chart.table.date")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.sales")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.refunds")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.expenses")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.vendorPmt")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.draws")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.contrib")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.adj")}</th>
                    <th className="text-end px-4 py-2.5 font-bold">{t("dashboard.chart.table.net")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.summary_date} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-2.5 font-medium text-on-surface whitespace-nowrap">{formatDate(d.summary_date)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-primary">{formatCurrency(d.sales)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-error">{formatCurrency(d.refunds)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-error">{formatCurrency(d.expenses)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-error">{formatCurrency(d.vendor_payments)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-error">{formatCurrency(d.owner_draws)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-secondary">{formatCurrency(d.owner_contributions)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table text-on-surface">{formatCurrency(d.adjustments)}</td>
                      <td className="px-4 py-2.5 text-end font-data-table font-bold text-on-surface">{formatCurrency(d.net_change)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-outline-variant/40 bg-surface-container-low">
                    <td className="px-4 py-3 font-bold text-on-surface uppercase text-[10px]">{t("dashboard.chart.table.total")}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-primary">{formatCurrency(totalSales)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalRefunds)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalExpenses)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalVendor)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-error">{formatCurrency(totalDraws)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-secondary">{formatCurrency(totalContrib)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-on-surface">{formatCurrency(totalAdj)}</td>
                    <td className="px-4 py-3 text-end font-data-table font-bold text-on-surface">{formatCurrency(netTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
