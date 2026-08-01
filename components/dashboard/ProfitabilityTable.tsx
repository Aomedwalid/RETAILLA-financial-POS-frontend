"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import type { ProfitabilityRow } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { useTranslation } from "react-i18next";

type SortKey = "gross_profit" | "units_sold" | "revenue" | "margin_pct";
type GroupBy = "product" | "category";

function marginTone(pct: number): { text: string; bar: string } {
  if (pct >= 50) return { text: "text-secondary", bar: "bg-secondary/20" };
  if (pct >= 20) return { text: "text-tertiary", bar: "bg-tertiary/20" };
  return { text: "text-error", bar: "bg-error/20" };
}

function barWidth(pct: number): string {
  return `${Math.min(Math.abs(pct), 100)}%`;
}

export default function ProfitabilityTable({ maxHeight = "400px" }: { maxHeight?: string }) {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const [groupBy, setGroupBy] = useState<GroupBy>("product");
  const [sortKey, setSortKey] = useState<SortKey>("gross_profit");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.reports.profitability({ start_date: startDate, end_date: endDate, group_by: groupBy }),
    queryFn: () => reportsApi.profitability({ start_date: startDate, end_date: endDate, group_by: groupBy }),
    enabled: !!accessToken,
  });

  const sorted = useMemo(() => {
    const rows: ProfitabilityRow[] = Array.isArray(data) ? data : [];
    const numericValue = (row: ProfitabilityRow, key: SortKey): number => {
      if (key === "margin_pct") return typeof row.margin_pct === "string" ? parseFloat(row.margin_pct) : row.margin_pct;
      return parseFloat(String(row[key]));
    };
    return [...rows].sort((a, b) => {
      const av = numericValue(a, sortKey);
      const bv = numericValue(b, sortKey);
      return sortAsc ? av - bv : bv - av;
    });
  }, [data, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const title = t("dashboard.profitability.title");
  const nameColumn = groupBy === "product" ? t("dashboard.profitability.product") : t("dashboard.profitability.category");

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
        <div className="h-3 w-36 rounded bg-surface-container-highest/60 mb-6" />
        <div className="flex gap-2 mb-6">
          <div className="h-7 w-24 rounded bg-surface-container-highest/60" />
          <div className="h-7 w-28 rounded bg-surface-container-highest/60" />
        </div>
        <div className="space-y-2">
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
        <p className="text-label-caps text-on-surface-variant uppercase mb-6">{title}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 mb-2">error_outline</span>
          <p className="text-xs text-on-surface-variant">{t("dashboard.profitability.failed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <p className="text-label-caps text-on-surface-variant uppercase whitespace-nowrap">{title}</p>
        <div role="group" aria-label={t("common.filter")} className="bg-surface-container-highest p-1 rounded-lg flex gap-1 shrink-0">
          <button
            type="button"
            aria-pressed={groupBy === "product"}
            onClick={() => setGroupBy("product")}
            className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-colors ${
              groupBy === "product"
                ? "bg-surface-container-low text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {t("dashboard.profitability.byProduct")}
          </button>
          <button
            type="button"
            aria-pressed={groupBy === "category"}
            onClick={() => setGroupBy("category")}
            className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-colors ${
              groupBy === "category"
                ? "bg-surface-container-low text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {t("dashboard.profitability.byCategory")}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 min-h-[200px] text-center">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-2">table_rows</span>
          <p className="text-xs text-on-surface-variant">{t("dashboard.profitability.noData")}</p>
        </div>
      ) : (
        <div
          role="region"
          aria-label={title}
          tabIndex={0}
          className="relative overflow-x-auto overflow-y-auto custom-scrollbar -mx-card-padding sm:mx-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset rounded-lg"
          style={maxHeight ? { maxHeight } : undefined}
        >
          <table className="w-full text-[11px] sm:text-xs table-auto min-w-[560px] sm:min-w-0">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-on-surface-variant uppercase tracking-wider text-[9px] sm:text-[10px] border-b border-outline-variant/30">
                <th scope="col" className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-start min-w-[100px] sm:min-w-[140px]">
                  {nameColumn}
                </th>
                <th
                  scope="col"
                  aria-sort={sortKey === "units_sold" ? (sortAsc ? "ascending" : "descending") : undefined}
                  className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end hidden sm:table-cell min-w-[60px]"
                >
                  <button type="button" onClick={() => toggleSort("units_sold")} className="flex items-center gap-0.5 justify-end w-full uppercase tracking-wider hover:text-on-surface transition-colors">
                    {t("dashboard.profitability.units")}
                    {sortKey === "units_sold" && <SortArrow asc={sortAsc} />}
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={sortKey === "revenue" ? (sortAsc ? "ascending" : "descending") : undefined}
                  className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end min-w-[80px] sm:min-w-[100px]"
                >
                  <button type="button" onClick={() => toggleSort("revenue")} className="flex items-center gap-0.5 justify-end w-full uppercase tracking-wider hover:text-on-surface transition-colors">
                    {t("dashboard.profitability.revenue")}
                    {sortKey === "revenue" && <SortArrow asc={sortAsc} />}
                  </button>
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end hidden sm:table-cell min-w-[80px] sm:min-w-[100px]">
                  {t("dashboard.profitability.cogs")}
                </th>
                <th
                  scope="col"
                  aria-sort={sortKey === "gross_profit" ? (sortAsc ? "ascending" : "descending") : undefined}
                  className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end min-w-[80px] sm:min-w-[100px]"
                >
                  <button type="button" onClick={() => toggleSort("gross_profit")} className="flex items-center gap-0.5 justify-end w-full uppercase tracking-wider hover:text-on-surface transition-colors">
                    {t("dashboard.profitability.grossProfit")}
                    {sortKey === "gross_profit" && <SortArrow asc={sortAsc} />}
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={sortKey === "margin_pct" ? (sortAsc ? "ascending" : "descending") : undefined}
                  className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end min-w-[70px] sm:min-w-[90px]"
                >
                  <button type="button" onClick={() => toggleSort("margin_pct")} className="flex items-center gap-0.5 justify-end w-full uppercase tracking-wider hover:text-on-surface transition-colors">
                    {t("dashboard.profitability.margin")}
                    {sortKey === "margin_pct" && <SortArrow asc={sortAsc} />}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const margin = typeof row.margin_pct === "string" ? parseFloat(row.margin_pct) : row.margin_pct;
                const tone = marginTone(margin);
                const name = row.group_name || row.group_id || t("dashboard.profitability.uncategorized");
                return (
                  <tr key={row.group_id || idx} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-2 sm:px-card-padding py-3 font-medium text-on-surface max-w-[120px] sm:max-w-[180px] lg:max-w-none">
                      <span className="truncate block" title={name}>{name}</span>
                    </td>
                    <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface hidden sm:table-cell whitespace-nowrap tabular-nums">
                      {formatNumber(row.units_sold ?? 0)}
                    </td>
                    <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface whitespace-nowrap tabular-nums">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface hidden sm:table-cell whitespace-nowrap tabular-nums">
                      {formatCurrency(row.cogs)}
                    </td>
                    <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface font-medium whitespace-nowrap tabular-nums">
                      {formatCurrency(row.gross_profit)}
                    </td>
                    <td className="px-2 sm:px-card-padding py-3 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <div className="w-10 sm:w-12 md:w-16 h-1.5 rounded-full bg-surface-container-highest overflow-hidden shrink-0">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: barWidth(margin) }} />
                        </div>
                        <span className={`font-data-table text-[10px] sm:text-xs font-bold ${tone.text} tabular-nums`}>
                          {formatPercent(margin)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortArrow({ asc }: { asc: boolean }) {
  return (
    <span className="material-symbols-outlined text-[12px] leading-none" aria-hidden="true">
      {asc ? "arrow_upward" : "arrow_downward"}
    </span>
  );
}
