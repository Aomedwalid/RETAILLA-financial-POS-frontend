"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

function marginColor(pct: number): string {
  if (pct >= 50) return "text-secondary";
  if (pct >= 20) return "text-tertiary";
  return "text-error";
}

function marginBg(pct: number): string {
  if (pct >= 50) return "bg-secondary/20";
  if (pct >= 20) return "bg-tertiary/20";
  return "bg-error/20";
}

function barWidth(pct: number): string {
  return `${Math.min(Math.abs(pct), 100)}%`;
}

type SortKey = "gross_profit" | "units_sold" | "revenue" | "margin_pct";
type GroupBy = "product" | "category";

export default function ProfitabilityTable() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const [groupBy, setGroupBy] = useState<GroupBy>("product");
  const [sortKey, setSortKey] = useState<SortKey>("gross_profit");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["profitability", startDate, endDate, groupBy],
    queryFn: () => reportsApi.profitability({ start_date: startDate, end_date: endDate, group_by: groupBy }),
    enabled: !!accessToken,
  });

  const raw = Array.isArray(data) ? data : [];
  function getVal(row: typeof raw[number], key: SortKey): number {
    if (key === "margin_pct") return typeof row.margin_pct === "string" ? parseFloat(row.margin_pct) : row.margin_pct;
    const field = key === "gross_profit" ? "gross_profit" : key === "revenue" ? "revenue" : key;
    return parseFloat(String(row[field as keyof typeof row]));
  }
  const sorted = [...raw].sort((a, b) => {
    const av = getVal(a, sortKey);
    const bv = getVal(b, sortKey);
    return sortAsc ? av - bv : bv - av;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? " ↑" : " ↓";
  }

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
        <p className="text-label-caps text-on-surface-variant uppercase mb-6">{t("dashboard.profitability.title")}</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-on-surface-variant">{t("dashboard.profitability.failed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <p className="text-label-caps text-on-surface-variant uppercase whitespace-nowrap">{t("dashboard.profitability.title")}</p>
        <div className="bg-surface-container-highest p-1 rounded-lg flex gap-1 shrink-0">
          <button
            onClick={() => setGroupBy("product")}
            className={
              groupBy === "product"
                ? "px-2 sm:px-3 py-1 rounded-md bg-surface-container-low text-[10px] sm:text-xs font-bold text-primary shadow-sm"
                : "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold text-on-surface-variant hover:text-primary"
            }
          >
            {t("dashboard.profitability.byProduct")}
          </button>
          <button
            onClick={() => setGroupBy("category")}
            className={
              groupBy === "category"
                ? "px-2 sm:px-3 py-1 rounded-md bg-surface-container-low text-[10px] sm:text-xs font-bold text-primary shadow-sm"
                : "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold text-on-surface-variant hover:text-primary"
            }
          >
            {t("dashboard.profitability.byCategory")}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-8 min-h-[200px]">
          <p className="text-xs text-on-surface-variant">{t("dashboard.profitability.noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar -mx-card-padding sm:mx-0">
          <table className="w-full text-[11px] sm:text-xs table-auto">
              <thead>
                <tr className="text-on-surface-variant uppercase tracking-wider text-[9px] sm:text-[10px] border-b border-outline-variant/30">
                  <th className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-start min-w-[100px] sm:min-w-[140px]">
                    {groupBy === "product" ? t("dashboard.profitability.product") : t("dashboard.profitability.category")}
                  </th>
                  <th
                    className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end cursor-pointer hover:text-on-surface hidden sm:table-cell min-w-[60px]"
                    onClick={() => toggleSort("units_sold")}
                  >
                    {t("dashboard.profitability.units")}{sortArrow("units_sold")}
                  </th>
                  <th
                    className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end cursor-pointer hover:text-on-surface min-w-[80px] sm:min-w-[100px]"
                    onClick={() => toggleSort("revenue")}
                  >
                    {t("dashboard.profitability.revenue")}{sortArrow("revenue")}
                  </th>
                  <th className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end hidden sm:table-cell min-w-[80px] sm:min-w-[100px]">{t("dashboard.profitability.cogs")}</th>
                  <th
                    className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end cursor-pointer hover:text-on-surface min-w-[80px] sm:min-w-[100px]"
                    onClick={() => toggleSort("gross_profit")}
                  >
                    {t("dashboard.profitability.grossProfit")}{sortArrow("gross_profit")}
                  </th>
                  <th
                    className="sticky top-0 z-10 bg-surface px-2 sm:px-card-padding py-2.5 font-bold text-end cursor-pointer hover:text-on-surface min-w-[70px] sm:min-w-[90px]"
                    onClick={() => toggleSort("margin_pct")}
                  >
                    {t("dashboard.profitability.margin")}{sortArrow("margin_pct")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const revenue = parseFloat(row.revenue);
                  const cogs = parseFloat(row.cogs);
                  const gp = parseFloat(row.gross_profit);
                  const margin = typeof row.margin_pct === "string" ? parseFloat(row.margin_pct) : row.margin_pct;
                  const name = row.group_name || row.group_id || t("dashboard.profitability.uncategorized");
                  return (
                    <tr key={row.group_id || idx} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-2 sm:px-card-padding py-3 font-medium text-on-surface max-w-[120px] sm:max-w-[180px] lg:max-w-none">
                        <span className="truncate block">{name}</span>
                      </td>
                      <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface hidden sm:table-cell whitespace-nowrap tabular-nums">
                        {(row.units_sold ?? 0).toLocaleString("ar-EG")}
                      </td>
                      <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface whitespace-nowrap tabular-nums">
                        {formatCurrency(revenue)}
                      </td>
                      <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface hidden sm:table-cell whitespace-nowrap tabular-nums">
                        {formatCurrency(cogs)}
                      </td>
                      <td className="px-2 sm:px-card-padding py-3 text-end font-data-table text-on-surface font-medium whitespace-nowrap tabular-nums">
                        {formatCurrency(gp)}
                      </td>
                      <td className="px-2 sm:px-card-padding py-3 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <div className="w-10 sm:w-12 md:w-16 h-1.5 rounded-full bg-surface-container-highest overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full ${marginBg(margin)}`}
                              style={{ width: barWidth(margin) }}
                            />
                          </div>
                          <span className={`font-data-table text-[10px] sm:text-xs font-bold ${marginColor(margin)} tabular-nums`}>
                            {margin.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%
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
