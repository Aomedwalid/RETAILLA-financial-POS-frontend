"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi, reconciliationApi } from "@/lib/api";
import type {
  StoreOverview, BusinessCashPosition, NetPositionResponse,
  WorkingCapitalPosition, OwnerEquitySummary, RunwayEstimate,
  BreakEvenEstimate, ProfitAndLoss, DailyCashSummaryItem,
  PaymentMethodBreakdownItem, ProfitabilityRow, LocationPerformance,
  CashierRefundAnomaly, CashierDiscountAnomaly, AnomalyThresholds, AnomalyThresholdsUpdate,
  CustomerCreditRisk, DebtDriftCheckItem, ReconciliationSummaryItem,
  BudgetStatusItem, ReconciliationCreateRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/format";

// ─── Helpers ───

const fmt = formatCurrency;
const fmtNum = (n: number | null | undefined): string => formatNumber(n ?? 0);
const fmtPct = formatPct;

function formatPct(value: number | string | null | undefined): string {
  if (value == null) return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("ar-EG", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + "%";
}

const fmtDate = formatDate;
const fmtDateTime = formatDateTime;

function cls(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Tab Definitions ───

type TabId = "overview" | "pnl" | "cashflow" | "locations" | "anomalies" | "credit" | "reconciliation" | "budgets";

// ─── Skeleton Components ───

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cls("bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse", className)}>
      <div className="h-3 w-24 rounded bg-surface-container-highest/60 mb-4" />
      <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
    </div>
  );
}

function SkeletonTable({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-card-padding">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 flex-1 rounded bg-surface-container-highest/40" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="material-symbols-outlined text-error text-2xl mb-2">error_outline</span>
      <p className="text-xs text-on-surface-variant">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1: OVERVIEW
// ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();

  const overviewQ = useQuery({
    queryKey: ["reports-overview", startDate, endDate],
    queryFn: () => reportsApi.overview({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const cashQ = useQuery({
    queryKey: ["reports-cash", startDate, endDate],
    queryFn: () => reportsApi.businessCashPosition({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const netQ = useQuery({
    queryKey: ["reports-net", startDate, endDate],
    queryFn: () => reportsApi.netPosition({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const wcQ = useQuery({
    queryKey: ["reports-wc"],
    queryFn: () => reportsApi.workingCapital(),
    enabled: !!accessToken,
  });
  const equityQ = useQuery({
    queryKey: ["reports-equity", startDate, endDate],
    queryFn: () => reportsApi.ownerEquity({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const runwayQ = useQuery({
    queryKey: ["reports-runway", 90],
    queryFn: () => reportsApi.runway(90),
    enabled: !!accessToken,
  });
  const beQ = useQuery({
    queryKey: ["reports-be", 30],
    queryFn: () => reportsApi.breakEven(30),
    enabled: !!accessToken,
  });

  const loading = overviewQ.isLoading || cashQ.isLoading || netQ.isLoading || wcQ.isLoading || equityQ.isLoading || runwayQ.isLoading || beQ.isLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-gutter">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2">
            <SkeletonCard />
          </div>
        ))}
        <div className="col-span-12 lg:col-span-6"><SkeletonCard className="min-h-[200px]" /></div>
        <div className="col-span-12 lg:col-span-6"><SkeletonCard className="min-h-[200px]" /></div>
      </div>
    );
  }

  const ov = overviewQ.data;
  const OVERVIEW_META: { key: keyof StoreOverview; label: string; icon: string; color: string }[] = [
    { key: "total_products", label: t("product.title"), icon: "inventory_2", color: "text-primary" },
    { key: "total_orders", label: t("dashboard.orders"), icon: "receipt", color: "text-secondary" },
    { key: "total_refunds", label: t("dashboard.refunds"), icon: "undo", color: "text-error" },
    { key: "total_customers", label: t("customer.title"), icon: "group", color: "text-tertiary" },
    { key: "total_discounts", label: t("dashboard.discounts"), icon: "sell", color: "text-primary-fixed-dim" },
    { key: "total_promo_codes", label: t("discount.promosTab"), icon: "card_giftcard", color: "text-secondary-fixed-dim" },
    { key: "total_team_members", label: t("nav.team"), icon: "badge", color: "text-tertiary-fixed-dim" },
  ];

  return (
    <div className="space-y-stack-lg">
      {/* Store Overview KPIs */}
      <div>
        <p className="text-label-caps text-on-surface-variant uppercase mb-3 px-1">{t("nav.dashboard")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-gutter">
          {OVERVIEW_META.map((m) => {
            const value = ov?.[m.key] ?? 0;
            return (
              <div key={m.key} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 border-l-4 border-l-primary transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={cls("p-1.5 rounded-lg bg-surface-container-low", m.color)}>
                    <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold font-data-table text-on-surface mb-0.5">
                  {typeof value === "number" ? fmtNum(value) : value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial KPIs Row */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Cash Position */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding h-full">
            <p className="text-label-caps text-on-surface-variant uppercase mb-1">{t("report.cashInflow")}</p>
            <p className="font-display-lg text-display-lg font-bold font-data-table text-primary mt-2">{fmt(cashQ.data?.business_cash_net)}</p>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("report.sales")}</span>
                <span className="font-data-table text-secondary">{fmt(cashQ.data?.total_sales)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("dashboard.refunds")}</span>
                <span className="font-data-table text-error">{fmt(cashQ.data?.total_refunds)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("dashboard.expenses")}</span>
                <span className="font-data-table text-error">{fmt(cashQ.data?.total_expenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("nav.vendors")}</span>
                <span className="font-data-table text-error">{fmt(cashQ.data?.total_vendor_payments)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-outline-variant/30 pt-2 font-bold">
                <span className="text-on-surface">{t("report.netCashFlow")}</span>
                <span className="font-data-table" style={{ color: parseFloat(cashQ.data?.business_cash_net ?? "0") >= 0 ? undefined : undefined }}>
                  {fmt(cashQ.data?.business_cash_net)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Position */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding h-full">
            <p className="text-label-caps text-on-surface-variant uppercase mb-1">{t("report.netCashFlow")}</p>
            <p className="font-display-lg text-display-lg font-bold font-data-table text-secondary mt-2">{fmt(netQ.data?.net_position)}</p>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("report.sales")}</span>
                <span className="font-data-table text-secondary">{fmt(netQ.data?.total_sales)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("dashboard.refunds")}</span>
                <span className="font-data-table text-error">{fmt(netQ.data?.total_refunds)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("dashboard.expenses")}</span>
                <span className="font-data-table text-error">{fmt(netQ.data?.total_expenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("nav.vendors")}</span>
                <span className="font-data-table text-error">{fmt(netQ.data?.total_vendor_payments)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-outline-variant/30 pt-2 font-bold">
                <span className="text-on-surface">{t("report.netCashFlow")}</span>
                <span className="font-data-table">{fmt(netQ.data?.net_position)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Working Capital + Owner Equity + Runway/BE */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
            <p className="text-label-caps text-on-surface-variant uppercase mb-2">{t("chart.workingCapital")}</p>
            <p className="text-2xl font-bold font-data-table text-tertiary">{fmt(wcQ.data?.net_working_capital)}</p>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-3">
              <span>{t("stats.totalRevenue")}: {fmt(wcQ.data?.receivable_from_customers)}</span>
              <span>{t("nav.vendors")}: {fmt(wcQ.data?.payable_to_vendors)}</span>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
            <p className="text-label-caps text-on-surface-variant uppercase mb-2">{t("common.total")}</p>
            <p className="text-2xl font-bold font-data-table text-primary-fixed-dim">{fmt(equityQ.data?.net_equity_change)}</p>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-3">
              <span>{t("customerDetail.totalSpent")}: {fmt(equityQ.data?.total_contributions)}</span>
              <span>{t("expense.titleFieldLabel")}: {fmt(equityQ.data?.total_draws)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-gutter">
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
              <p className="text-label-caps text-[10px] text-on-surface-variant uppercase mb-1">{t("chart.cashFlow")}</p>
              <p className="text-lg font-bold font-data-table text-primary">
                {runwayQ.data?.runway_days != null ? Math.round(parseFloat(runwayQ.data.runway_days) / 30 * 10) / 10 + "mo" : "∞"}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-1">{fmt(runwayQ.data?.operating_cash)} {t("stats.totalRevenue")}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
              <p className="text-label-caps text-[10px] text-on-surface-variant uppercase mb-1">{t("chart.breakEven")}</p>
              <p className="text-lg font-bold font-data-table text-secondary">
                {beQ.data?.break_even_daily_revenue != null ? fmt(beQ.data.break_even_daily_revenue) + "/d" : "N/A"}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-1">{t("stats.totalRevenue")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2: PROFIT & LOSS
// ─────────────────────────────────────────────────────────────

function PnLTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const [groupBy, setGroupBy] = useState<"product" | "category">("product");

  const pnlQ = useQuery({
    queryKey: ["reports-pnl", startDate, endDate],
    queryFn: () => reportsApi.profitAndLoss({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const profQ = useQuery({
    queryKey: ["reports-profitability", startDate, endDate, groupBy],
    queryFn: () => reportsApi.profitability({ start_date: startDate, end_date: endDate, group_by: groupBy }),
    enabled: !!accessToken,
  });
  const equityQ = useQuery({
    queryKey: ["reports-equity2", startDate, endDate],
    queryFn: () => reportsApi.ownerEquity({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  if (pnlQ.isLoading || profQ.isLoading || equityQ.isLoading) {
    return (
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-6"><SkeletonCard className="min-h-[300px]" /></div>
        <div className="col-span-12 lg:col-span-6"><SkeletonCard className="min-h-[300px]" /></div>
      </div>
    );
  }

  const pnl = pnlQ.data;
  const pnlItems: { label: string; value: string; color: string; border: string }[] = [
    { label: t("stats.totalRevenue"), value: fmt(pnl?.gross_revenue), color: "text-primary", border: "border-l-primary" },
    { label: t("report.totalExpenses"), value: fmt(pnl?.total_refunds), color: "text-error", border: "border-l-error" },
    { label: t("report.netProfit"), value: fmt(pnl?.net_revenue), color: "text-secondary", border: "border-l-secondary" },
    { label: "COGS", value: fmt(pnl?.total_cogs), color: "text-tertiary", border: "border-l-tertiary" },
    { label: t("dashboard.grossProfit"), value: fmt(pnl?.gross_profit), color: "text-secondary", border: "border-l-secondary" },
    { label: t("dashboard.expenses"), value: fmt(pnl?.total_operating_expenses), color: "text-error", border: "border-l-error" },
    { label: t("report.netProfit"), value: fmt(pnl?.net_profit), color: parseFloat(pnl?.net_profit ?? "0") >= 0 ? "text-secondary" : "text-error", border: "border-l-secondary" },
  ];

  const profitRows: ProfitabilityRow[] = Array.isArray(profQ.data) ? profQ.data : [];

  return (
    <div className="space-y-stack-lg">
      {/* P&L Waterfall */}
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
            <p className="text-label-caps text-on-surface-variant uppercase mb-4">{t("reports.pnl")}</p>
            <div className="space-y-0">
              {pnlItems.map((item, i) => (
                <div key={item.label} className={cls("flex items-center justify-between py-3 border-l-4 px-4", item.border, i < pnlItems.length - 1 ? "border-b border-outline-variant/10" : "")}>
                  <span className="text-sm text-on-surface-variant">{item.label}</span>
                  <span className={cls("font-data-table text-sm font-bold", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-gutter">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
            <p className="text-label-caps text-on-surface-variant uppercase mb-2">{t("common.total")}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("customerDetail.totalSpent")}</span>
                <span className="font-data-table text-secondary">{fmt(equityQ.data?.total_contributions)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("expense.titleFieldLabel")}</span>
                <span className="font-data-table text-error">{fmt(equityQ.data?.total_draws)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-outline-variant/30 pt-2 font-bold">
                <span className="text-on-surface">{t("report.netCashFlow")}</span>
                <span className={cls("font-data-table", parseFloat(equityQ.data?.net_equity_change ?? "0") >= 0 ? "text-secondary" : "text-error")}>
                  {fmt(equityQ.data?.net_equity_change)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
            <p className="text-label-caps text-on-surface-variant uppercase mb-2">{t("report.grossMargin")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-on-surface-variant">{t("report.grossMargin")}</p>
                <p className="font-data-table text-sm font-bold text-secondary">
                  {pnl?.gross_revenue && pnl?.gross_profit
                    ? ((parseFloat(pnl.gross_profit) / parseFloat(pnl.gross_revenue)) * 100).toFixed(1) + "%"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant">{t("report.profitMargin")}</p>
                <p className="font-data-table text-sm font-bold text-primary">
                  {pnl?.gross_revenue && pnl?.net_profit
                    ? ((parseFloat(pnl.net_profit) / parseFloat(pnl.gross_revenue)) * 100).toFixed(1) + "%"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant">COGS</p>
                <p className="font-data-table text-sm font-bold text-tertiary">
                  {pnl?.gross_revenue && pnl?.total_cogs
                    ? ((parseFloat(pnl.total_cogs) / parseFloat(pnl.gross_revenue)) * 100).toFixed(1) + "%"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant">{t("report.totalExpenses")}</p>
                <p className="font-data-table text-sm font-bold text-error">
                  {pnl?.gross_revenue && pnl?.total_operating_expenses
                    ? ((parseFloat(pnl.total_operating_expenses) / parseFloat(pnl.gross_revenue)) * 100).toFixed(1) + "%"
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profitability Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("report.monthlyTrend")}</p>
          <div className="bg-surface-container-highest p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setGroupBy("product")}
              className={cls("px-3 py-1 rounded-md text-xs font-bold transition-colors", groupBy === "product" ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant hover:text-primary")}
            >
                {t("product.title")}
            </button>
            <button
              onClick={() => setGroupBy("category")}
              className={cls("px-3 py-1 rounded-md text-xs font-bold transition-colors", groupBy === "category" ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant hover:text-primary")}
            >
              {t("product.category")}
            </button>
          </div>
        </div>
        {profitRows.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10 text-sm">No data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <th className="px-card-padding py-3 font-bold">{groupBy === "product" ? t("product.title") : t("product.category")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("product.units")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("stats.totalRevenue")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">COGS</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("dashboard.grossProfit")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("product.margin")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {profitRows.map((row, idx) => {
                  const margin = typeof row.margin_pct === "string" ? parseFloat(row.margin_pct) : row.margin_pct;
                  let marginColor = "text-error";
                  let marginBg = "bg-error/20";
                  if (margin >= 50) { marginColor = "text-secondary"; marginBg = "bg-secondary/20"; }
                  else if (margin >= 20) { marginColor = "text-tertiary"; marginBg = "bg-tertiary/20"; }
                  return (
                    <tr key={row.group_id || idx} className="hover:bg-surface-container-highest transition-colors">
                      <td className="px-card-padding py-3 font-medium text-sm">{row.group_name || t("product.category")}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{row.units_sold ?? 0}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(row.revenue)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(row.cogs)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm font-medium">{fmt(row.gross_profit)}</td>
                      <td className="px-card-padding py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div className={cls("h-full rounded-full", marginBg)} style={{ width: `${Math.min(Math.abs(margin), 100)}%` }} />
                          </div>
                          <span className={cls("font-data-table text-xs font-bold", marginColor)}>{margin.toFixed(1)}%</span>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 3: CASH FLOW
// ─────────────────────────────────────────────────────────────

function CashFlowTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();

  const dsQ = useQuery({
    queryKey: ["reports-dailysummary", startDate, endDate],
    queryFn: () => reportsApi.dailySummary({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const pmQ = useQuery({
    queryKey: ["reports-paymentmethods", startDate, endDate],
    queryFn: () => reportsApi.paymentMethods({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  if (dsQ.isLoading || pmQ.isLoading) {
    return (
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8"><SkeletonCard className="min-h-[400px]" /></div>
        <div className="col-span-12 lg:col-span-4"><SkeletonCard className="min-h-[400px]" /></div>
      </div>
    );
  }

  const dailyItems: DailyCashSummaryItem[] = Array.isArray(dsQ.data) ? dsQ.data : [];
  const pmItems = (Array.isArray(pmQ.data) && pmQ.data.length > 0 ? pmQ.data : []).map((d) => ({
    method: d.payment_method,
    amount: parseFloat(String(d.total_amount)),
    count: d.transaction_count,
  }));
  const totalPmAmount = pmItems.reduce((s, i) => s + i.amount, 0);
  const totalPmCount = pmItems.reduce((s, i) => s + i.count, 0);

  const totalSales = dailyItems.reduce((s, d) => s + (d.sales ?? 0), 0);
  const totalRefunds = dailyItems.reduce((s, d) => s + (d.refunds ?? 0), 0);
  const totalExpenses = dailyItems.reduce((s, d) => s + (d.expenses ?? 0), 0);
  const totalVendor = dailyItems.reduce((s, d) => s + (d.vendor_payments ?? 0), 0);
  const totalDraws = dailyItems.reduce((s, d) => s + (d.owner_draws ?? 0), 0);
  const totalContrib = dailyItems.reduce((s, d) => s + (d.owner_contributions ?? 0), 0);
  const totalNet = dailyItems.reduce((s, d) => s + (d.net_change ?? 0), 0);

  return (
    <div className="grid grid-cols-12 gap-gutter">
      {/* Daily Summary Table */}
      <div className="col-span-12 lg:col-span-8">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
          <p className="text-label-caps text-on-surface-variant uppercase mb-4">{t("report.monthlyTrend")}</p>
          {dailyItems.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10 text-sm">{t("table.noData")}</p>
          ) : (
            <div className="overflow-auto max-h-[500px] -mx-card-padding custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-on-surface-variant uppercase tracking-wider text-[10px] border-b border-outline-variant/30 bg-surface-container-low">
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-left">{t("common.date")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("report.sales")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("dashboard.refunds")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("dashboard.expenses")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("nav.vendors")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("expense.titleFieldLabel")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("customerDetail.totalSpent")}</th>
                    <th className="sticky top-0 z-10 bg-surface-container-low px-card-padding py-2 font-bold text-right">{t("report.netCashFlow")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyItems.map((d) => (
                    <tr key={d.summary_date} className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                      <td className="px-card-padding py-2.5 font-medium text-on-surface whitespace-nowrap">{d.summary_date}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-primary">{fmt(d.sales)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-error">{fmt(d.refunds)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-error">{fmt(d.expenses)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-error">{fmt(d.vendor_payments)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-error">{fmt(d.owner_draws)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table text-secondary">{fmt(d.owner_contributions)}</td>
                      <td className="px-card-padding py-2.5 text-right font-data-table font-bold text-on-surface">{fmt(d.net_change)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-outline-variant/40 bg-surface-container-low">
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 font-bold text-on-surface uppercase text-[10px]">{t("common.total")}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-primary">{fmt(totalSales)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-error">{fmt(totalRefunds)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-error">{fmt(totalExpenses)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-error">{fmt(totalVendor)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-error">{fmt(totalDraws)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-secondary">{fmt(totalContrib)}</td>
                    <td className="sticky bottom-0 z-10 bg-surface-container-low px-card-padding py-3 text-right font-data-table font-bold text-on-surface">{fmt(totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods + Mini Stats */}
      <div className="col-span-12 lg:col-span-4 space-y-gutter">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
          <p className="text-label-caps text-on-surface-variant uppercase mb-4">{t("chart.paymentDistribution")}</p>
          {pmItems.length === 0 ? (
            <p className="text-center text-on-surface-variant py-8 text-xs">{t("table.noData")}</p>
          ) : (
            <div className="space-y-4">
              {pmItems.map((i) => {
                const pct = totalPmAmount > 0 ? (i.amount / totalPmAmount) * 100 : 0;
                return (
                  <div key={i.method} className="bg-surface-container-low rounded-lg p-card-padding border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold uppercase tracking-wider">{i.method}</span>
                      <span className="text-xs font-bold text-on-surface-variant">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={cls("h-full rounded-full", i.method === "CASH" ? "bg-primary" : "bg-secondary")} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mt-2">
                      <span>{fmt(i.amount)}</span>
                      <span>{i.count} txns</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
          <p className="text-label-caps text-on-surface-variant uppercase mb-3">{t("report.netCashFlow")}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">{t("stats.totalSales")}</span>
              <span className="font-data-table text-primary font-bold">{fmt(totalSales)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">{t("report.cashOutflow")}</span>
              <span className="font-data-table text-error font-bold">{fmt(totalRefunds + totalExpenses + totalVendor + totalDraws)}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-outline-variant/30 pt-2 font-bold">
              <span className="text-on-surface">{t("report.netCashFlow")}</span>
              <span className={cls("font-data-table", totalNet >= 0 ? "text-secondary" : "text-error")}>{fmt(totalNet)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 4: LOCATIONS
// ─────────────────────────────────────────────────────────────

function LocationsTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const q = useQuery({
    queryKey: ["reports-locations"],
    queryFn: () => reportsApi.locations(),
    enabled: !!accessToken,
  });

  const locations: LocationPerformance[] = Array.isArray(q.data) ? q.data : [];
  const maxSales = locations.length > 0 ? Math.max(...locations.map((l) => parseFloat(String(l.total_sales)))) : 1;

  if (q.isLoading) return <SkeletonCard className="min-h-[300px]" />;
  if (q.error) return <ErrorMessage message={t("common.failedToLoad")} />;

  if (locations.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding text-center py-16">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-3">store</span>
        <p className="text-sm text-on-surface-variant">{t("table.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
      <div className="p-card-padding border-b border-outline-variant">
        <p className="text-label-caps text-on-surface-variant uppercase">{t("report.locationBreakdown")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high">
            <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              <th className="px-card-padding py-4 font-bold">{t("report.location")}</th>
              <th className="px-card-padding py-4 font-bold text-right">{t("report.sales")}</th>
              <th className="px-card-padding py-4 font-bold text-right">{t("dashboard.refunds")}</th>
              <th className="px-card-padding py-4 font-bold text-right">{t("dashboard.expenses")}</th>
              <th className="px-card-padding py-4 font-bold text-right">{t("report.netCashFlow")}</th>
              <th className="px-card-padding py-4 font-bold">{t("stats.totalRevenue")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {locations.map((loc, idx) => {
              const sales = parseFloat(String(loc.total_sales));
              const barPct = (sales / maxSales) * 100;
              let barColor = "bg-secondary";
              if (barPct < 30) barColor = "bg-error";
              else if (barPct < 60) barColor = "bg-primary";
              return (
                <tr key={loc.location_id ?? idx} className="hover:bg-surface-container-highest transition-colors">
                  <td className="px-card-padding py-4 font-medium text-sm">{loc.location_name}</td>
                  <td className="px-card-padding py-4 text-right font-data-table text-sm text-primary">{fmt(loc.total_sales)}</td>
                  <td className="px-card-padding py-4 text-right font-data-table text-sm text-error">{fmt(loc.total_refunds)}</td>
                  <td className="px-card-padding py-4 text-right font-data-table text-sm text-error">{fmt(loc.total_expenses)}</td>
                  <td className={cls("px-card-padding py-4 text-right font-data-table text-sm font-bold", parseFloat(String(loc.net_cash_position)) >= 0 ? "text-secondary" : "text-error")}>
                    {fmt(loc.net_cash_position)}
                  </td>
                  <td className="px-card-padding py-4">
                    <div className="h-2 w-24 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={cls("h-full rounded-full", barColor)} style={{ width: `${barPct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 5: ANOMALIES
// ─────────────────────────────────────────────────────────────

function AnomaliesTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const queryClient = useQueryClient();
  const [showThresholds, setShowThresholds] = useState(false);

  const refundQ = useQuery({
    queryKey: ["reports-refund-anomalies", startDate, endDate],
    queryFn: () => reportsApi.refundAnomalies({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const discountQ = useQuery({
    queryKey: ["reports-discount-anomalies", startDate, endDate],
    queryFn: () => reportsApi.discountAnomalies({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const threshQ = useQuery({
    queryKey: ["reports-anomaly-thresholds"],
    queryFn: () => reportsApi.getAnomalyThresholds(),
    enabled: !!accessToken,
  });

  const refundData: CashierRefundAnomaly[] = Array.isArray(refundQ.data) ? refundQ.data : [];
  const discountData: CashierDiscountAnomaly[] = Array.isArray(discountQ.data) ? discountQ.data : [];
  const anomalyCount = refundData.filter((r) => r.is_refund_anomaly).length + discountData.filter((d) => d.is_discount_anomaly).length;

  const handleSaved = useCallback(() => {
    setShowThresholds(false);
    queryClient.invalidateQueries({ queryKey: ["reports-refund-anomalies"] });
    queryClient.invalidateQueries({ queryKey: ["reports-discount-anomalies"] });
    queryClient.invalidateQueries({ queryKey: ["reports-anomaly-thresholds"] });
  }, [queryClient]);

  const loading = refundQ.isLoading || discountQ.isLoading || threshQ.isLoading;

  if (loading) return <SkeletonCard className="min-h-[400px]" />;

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <p className="text-label-caps text-on-surface-variant uppercase">{t("anomaly.title")}</p>
            {anomalyCount > 0 && (
              <span className="text-[10px] bg-error/15 text-error px-2 py-0.5 rounded font-bold">
                {anomalyCount} Flag{anomalyCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowThresholds(!showThresholds)}
            className={cls("text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors", showThresholds ? "bg-primary/15 text-primary" : "bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest")}
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            {t("filter.sortBy")}
          </button>
        </div>

        {showThresholds && threshQ.data && (
          <ThresholdsSettings thresholds={threshQ.data} onSaved={handleSaved} />
        )}

        {refundData.length === 0 && discountData.length === 0 && !refundQ.error && !discountQ.error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="material-symbols-outlined text-[36px] text-secondary mb-3">check_circle</span>
            <p className="text-sm text-on-surface-variant font-medium">{t("anomaly.noAnomalies")}</p>
            <p className="text-[11px] text-on-surface-variant/60 mt-1">{t("common.all")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant/30">
            {/* Refund Anomalies */}
            <div className="bg-surface-container-low p-card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">emergency_home</span>
                  {t("anomaly.refundAnomaly")}
                </h3>
                <span className="text-[10px] text-on-surface-variant">{refundData.filter((r) => r.is_refund_anomaly).length} of {refundData.length} flagged</span>
              </div>
              {refundQ.error ? (
                <ErrorMessage message={t("common.error")} />
              ) : refundData.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8 text-xs">{t("table.noData")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                        <th className="pb-2 pr-2 font-semibold">{t("common.name")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("dashboard.orders")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("dashboard.refunds")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("report.profitMargin")}</th>
                        <th className="pb-2 font-semibold text-center">{t("common.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {refundData.map((r) => (
                        <tr key={r.user_id} className={cls("transition-colors", r.is_refund_anomaly ? "bg-error-container/15 hover:bg-error-container/25" : "hover:bg-surface-container-high")}>
                          <td className="py-2.5 pr-2 font-medium truncate max-w-[120px]" title={r.user_email ?? r.user_id}>
                            {r.user_email ?? r.user_id}
                          </td>
                          <td className="py-2.5 pr-2 text-right tabular-nums text-on-surface-variant">{r.order_count}</td>
                          <td className="py-2.5 pr-2 text-right tabular-nums text-on-surface-variant">{r.refund_count}</td>
                          <td className={cls("py-2.5 pr-2 text-right tabular-nums font-medium", r.is_refund_anomaly ? "text-error" : "")}>
                            {fmtPct(r.refund_rate)}
                          </td>
                          <td className="py-2.5 text-center">
                            {r.is_refund_anomaly ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error">
                                <span className="material-symbols-outlined text-[14px]">emergency</span>Anomaly
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Discount Anomalies */}
            <div className="bg-surface-container-low p-card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">sell</span>
                  {t("anomaly.discountAnomaly")}
                </h3>
                <span className="text-[10px] text-on-surface-variant">{discountData.filter((d) => d.is_discount_anomaly).length} of {discountData.length} flagged</span>
              </div>
              {discountQ.error ? (
                <ErrorMessage message={t("common.error")} />
              ) : discountData.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8 text-xs">{t("table.noData")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                        <th className="pb-2 pr-2 font-semibold">{t("common.name")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("dashboard.orders")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("dashboard.discounts")}</th>
                        <th className="pb-2 pr-2 font-semibold text-right">{t("report.profitMargin")}</th>
                        <th className="pb-2 font-semibold text-center">{t("common.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {discountData.map((d) => (
                        <tr key={d.user_id} className={cls("transition-colors", d.is_discount_anomaly ? "bg-error-container/15 hover:bg-error-container/25" : "hover:bg-surface-container-high")}>
                          <td className="py-2.5 pr-2 font-medium truncate max-w-[120px]" title={d.user_email ?? d.user_id}>
                            {d.user_email ?? d.user_id}
                          </td>
                          <td className="py-2.5 pr-2 text-right tabular-nums text-on-surface-variant">{d.order_count}</td>
                          <td className="py-2.5 pr-2 text-right tabular-nums text-on-surface-variant">{d.discount_usage_count}</td>
                          <td className={cls("py-2.5 pr-2 text-right tabular-nums font-medium", d.is_discount_anomaly ? "text-error" : "")}>
                            {fmtPct(d.discount_rate)}
                          </td>
                          <td className="py-2.5 text-center">
                            {d.is_discount_anomaly ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error">
                                <span className="material-symbols-outlined text-[14px]">emergency</span>{t("anomaly.suspicious")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>{t("common.active")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThresholdsSettings({ thresholds, onSaved }: { thresholds: AnomalyThresholds; onSaved: () => void }) {
  const [refundMultiplier, setRefundMultiplier] = useState(String(thresholds.refund_rate_alert_multiplier));
  const [discountMultiplier, setDiscountMultiplier] = useState(String(thresholds.discount_usage_alert_multiplier));
  const [reconThreshold, setReconThreshold] = useState(String(thresholds.reconciliation_discrepancy_alert_threshold));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    setError(null); setSuccess(false);
    const refund = parseFloat(refundMultiplier);
    const discount = parseFloat(discountMultiplier);
    const recon = parseFloat(reconThreshold);
    if (isNaN(refund) || refund <= 1.0) { setError("Refund multiplier must be > 1.0"); return; }
    if (isNaN(discount) || discount <= 1.0) { setError("Discount multiplier must be > 1.0"); return; }
    if (isNaN(recon) || recon <= 0) { setError("Reconciliation threshold must be > 0"); return; }
    setSaving(true);
    try {
      await reportsApi.updateAnomalyThresholds({
        refund_rate_alert_multiplier: refund,
        discount_usage_alert_multiplier: discount,
        reconciliation_discrepancy_alert_threshold: recon,
      });
      setSuccess(true);
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thresholds");
    } finally { setSaving(false); }
  }, [refundMultiplier, discountMultiplier, reconThreshold, onSaved]);

  return (
    <div className="border-b border-outline-variant bg-surface-container-low px-card-padding py-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">Refund Alert Multiplier</label>
          <div className="relative">
            <input type="number" step="0.1" min="1.1" value={refundMultiplier} onChange={(e) => setRefundMultiplier(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">×</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">Discount Alert Multiplier</label>
          <div className="relative">
            <input type="number" step="0.1" min="1.1" value={discountMultiplier} onChange={(e) => setDiscountMultiplier(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">×</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">Recon Discrepancy Threshold</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">$</span>
            <input type="number" step="0.01" min="0.01" value={reconThreshold} onChange={(e) => setReconThreshold(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg pl-7 pr-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-[11px] text-error mb-3 bg-error-container/15 px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">error</span>{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-[11px] text-secondary mb-3 bg-secondary/10 px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>Thresholds updated
        </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 6: CREDIT RISK
// ─────────────────────────────────────────────────────────────

function CreditRiskTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [customerFilter, setCustomerFilter] = useState("");

  const riskQ = useQuery({
    queryKey: ["reports-credit-risk", customerFilter],
    queryFn: () => reportsApi.customerCreditRisk(customerFilter || undefined),
    enabled: !!accessToken,
  });
  const driftQ = useQuery({
    queryKey: ["reports-debt-drift"],
    queryFn: () => reportsApi.customerDebtDriftCheck(),
    enabled: !!accessToken,
  });

  const riskData: CustomerCreditRisk[] = Array.isArray(riskQ.data) ? riskQ.data : [];
  const driftData: DebtDriftCheckItem[] = Array.isArray(driftQ.data) ? driftQ.data : [];
  const hasDriftIssues = driftData.some((d) => Math.abs(parseFloat(String(d.drift))) > 0.01);

  if (riskQ.isLoading || driftQ.isLoading) return <SkeletonCard className="min-h-[400px]" />;

  return (
    <div className="space-y-stack-lg">
      {/* Customer Credit Risk Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("report.topCategories")}</p>
          <input
            type="text"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            placeholder={t("search.placeholder")}
            className="bg-surface-container-high border border-outline-variant rounded-lg py-1.5 px-3 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary w-48"
          />
        </div>
        {riskData.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10 text-sm">{t("table.noData")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <th className="px-card-padding py-3 font-bold">{t("customer.title")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("customer.currentDebt")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("common.total")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("pos.pricing.totalDue")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("common.amount")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("report.profitMargin")}</th>
                  <th className="px-card-padding py-3 font-bold text-center">{t("product.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {riskData.map((c) => {
                  let tierColor = "text-secondary bg-secondary/10";
                  if (c.risk_tier === "MEDIUM_RISK") tierColor = "text-tertiary bg-tertiary/10";
                  else if (c.risk_tier === "HIGH_RISK") tierColor = "text-error bg-error/10";
                  return (
                    <tr key={c.customer_id} className="hover:bg-surface-container-highest transition-colors">
                      <td className="px-card-padding py-3 font-medium text-sm">{c.customer_name}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm text-error font-bold">{fmt(c.current_debt)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(c.total_charges)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm text-secondary">{fmt(c.total_payments)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">
                        {c.avg_payment_delay_days != null ? c.avg_payment_delay_days.toFixed(1) + "d" : "—"}
                      </td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">
                        {c.late_payment_rate != null ? (c.late_payment_rate * 100).toFixed(1) + "%" : "—"}
                      </td>
                      <td className="px-card-padding py-3 text-center">
                        <span className={cls("px-2 py-0.5 rounded text-[10px] font-bold uppercase", tierColor)}>
                          {c.risk_tier.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debt Drift Check */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <p className="text-label-caps text-on-surface-variant uppercase">{t("common.debt")}</p>
            {hasDriftIssues && (
              <span className="text-[10px] bg-error/15 text-error px-2 py-0.5 rounded font-bold">
                {driftData.filter((d) => Math.abs(parseFloat(String(d.drift))) > 0.01).length} Drift{driftData.filter((d) => Math.abs(parseFloat(String(d.drift))) > 0.01).length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {!hasDriftIssues && driftData.length > 0 && (
            <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded font-bold">{t("common.all")}</span>
          )}
        </div>
        {driftData.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10 text-sm">{t("table.noData")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <th className="px-card-padding py-3 font-bold">{t("customer.title")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("customer.currentDebt")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("common.total")}</th>
                  <th className="px-card-padding py-3 font-bold text-right">{t("common.amount")}</th>
                  <th className="px-card-padding py-3 font-bold text-center">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {driftData.map((d, idx) => {
                  const drift = parseFloat(String(d.drift));
                  const isDrift = Math.abs(drift) > 0.01;
                  return (
                    <tr key={d.customer_id || idx} className={cls("hover:bg-surface-container-highest transition-colors", isDrift ? "bg-error-container/5" : "")}>
                      <td className="px-card-padding py-3 font-medium text-sm">{d.customer_name}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(d.recorded_debt_column)}</td>
                      <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(d.computed_debt_from_events)}</td>
                      <td className={cls("px-card-padding py-3 text-right font-data-table text-sm font-bold", isDrift ? "text-error" : "text-secondary")}>
                        {fmt(d.drift)}
                      </td>
                      <td className="px-card-padding py-3 text-center">
                        {isDrift ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error">
                            <span className="material-symbols-outlined text-[14px]">warning</span>{t("common.amount")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>{t("common.all")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 7: RECONCILIATION
// ─────────────────────────────────────────────────────────────

function ReconciliationTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [reconLocation, setReconLocation] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const locQ = useQuery({ queryKey: ["reports-loc-list"], queryFn: () => reportsApi.locations(), enabled: !!accessToken });
  const reconQ = useQuery({
    queryKey: ["reports-recons", reconLocation],
    queryFn: () => reportsApi.getReconciliations(reconLocation),
    enabled: !!reconLocation && !!accessToken,
  });

  const locData = locQ.data ?? [];
  const reconData: ReconciliationSummaryItem[] = reconQ.data ?? [];

  function handleCreated() {
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ["reports-recons"] });
  }

  function discrepancyColor(flag: string): string {
    switch (flag) {
      case "BALANCED": return "text-secondary";
      case "MINOR_DISCREPANCY": return "text-tertiary";
      case "SIGNIFICANT_DISCREPANCY": return "text-error";
      default: return "text-on-surface-variant";
    }
  }

  function discrepancyBadge(flag: string) {
    const map: Record<string, string> = {
      BALANCED: "bg-secondary/10 text-secondary",
      MINOR_DISCREPANCY: "bg-tertiary/10 text-tertiary",
      SIGNIFICANT_DISCREPANCY: "bg-error/10 text-error",
    };
    return map[flag] ?? "bg-surface-variant/20 text-on-surface-variant";
  }

  return (
    <div className="space-y-stack-lg">
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("reports.reconciliation")}</p>
          <div className="flex items-center gap-3">
            <select
              value={reconLocation}
              onChange={(e) => setReconLocation(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-1.5 px-3 text-xs text-on-surface-variant outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("product.selectCategory")}</option>
              {locQ.data?.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>
              ))}
            </select>
            {reconLocation && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t("common.add")}
              </button>
            )}
          </div>
        </div>

        {!reconLocation ? (
          <p className="text-center text-on-surface-variant py-12 text-sm">Select a location to view reconciliation records</p>
        ) : reconQ.isLoading ? (
          <SkeletonTable />
        ) : reconQ.error ? (
          <ErrorMessage message="Failed to load reconciliation data" />
        ) : reconData.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8 text-sm">No records for this location</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <th className="px-card-padding py-3 font-bold">Period</th>
                  <th className="px-card-padding py-3 font-bold">Reconciled By</th>
                  <th className="px-card-padding py-3 font-bold text-right">Expected</th>
                  <th className="px-card-padding py-3 font-bold text-right">Counted</th>
                  <th className="px-card-padding py-3 font-bold text-right">Discrepancy</th>
                  <th className="px-card-padding py-3 font-bold text-center">Status</th>
                  <th className="px-card-padding py-3 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {reconData.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-highest transition-colors">
                    <td className="px-card-padding py-3 text-sm">{fmtDate(r.period_start)} &mdash; {fmtDate(r.period_end)}</td>
                    <td className="px-card-padding py-3 text-sm text-on-surface-variant">{r.reconciled_by}</td>
                    <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(r.expected_cash)}</td>
                    <td className="px-card-padding py-3 text-right font-data-table text-sm">{fmt(r.counted_cash)}</td>
                    <td className={cls("px-card-padding py-3 text-right font-data-table text-sm font-bold", discrepancyColor(r.discrepancy_flag))}>{fmt(r.discrepancy)}</td>
                    <td className="px-card-padding py-3 text-center">
                      <span className={cls("px-2 py-0.5 rounded text-[10px] font-bold uppercase", discrepancyBadge(r.discrepancy_flag))}>
                        {r.discrepancy_flag === "MINOR_DISCREPANCY" ? "MINOR" : r.discrepancy_flag === "SIGNIFICANT_DISCREPANCY" ? "SIGNIFICANT" : r.discrepancy_flag}
                      </span>
                    </td>
                    <td className="px-card-padding py-3 text-xs text-on-surface-variant max-w-[120px] truncate">{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateReconciliationModal
          locationId={reconLocation}
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreated}
        />
      )}
    </div>
  );
}

function CreateReconciliationModal({ locationId, onClose, onSuccess }: { locationId: string; onClose: () => void; onSuccess: () => void }) {
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReconciliationSummaryItem | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!countedCash || parseFloat(countedCash) <= 0) { setError("Counted cash must be > 0"); return; }
    setError(""); setSaving(true);
    try {
      const body: ReconciliationCreateRequest = {
        period_start: periodStart,
        period_end: periodEnd,
        counted_cash: parseFloat(countedCash),
      };
      if (notes.trim()) body.notes = notes.trim();
      const res = await reportsApi.createReconciliation(locationId, body);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally { setSaving(false); }
  }

  if (result) {
    const flag = result.discrepancy_flag;
    const isBalanced = flag === "BALANCED";
    const isMinor = flag === "MINOR_DISCREPANCY";
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Reconciliation Result</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className={cls("p-4 rounded-xl text-center", isBalanced ? "bg-secondary/10" : isMinor ? "bg-tertiary/10" : "bg-error/10")}>
              <span className={cls("material-symbols-outlined text-3xl mb-2", isBalanced ? "text-secondary" : isMinor ? "text-tertiary" : "text-error")}>
                {isBalanced ? "check_circle" : isMinor ? "warning" : "gpp_bad"}
              </span>
              <p className={cls("font-headline-sm text-headline-sm mb-1", isBalanced ? "text-secondary" : isMinor ? "text-tertiary" : "text-error")}>
                {isBalanced ? "Balanced" : isMinor ? "Minor Discrepancy" : "Significant Discrepancy"}
              </p>
              <div className="space-y-1 mt-4">
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Expected</span><span className="font-data-table">{fmt(result.expected_cash)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Counted</span><span className="font-data-table">{fmt(result.counted_cash)}</span></div>
                <div className="flex justify-between text-sm font-bold border-t border-outline-variant pt-2 mt-2">
                  <span className="text-on-surface-variant">Discrepancy</span>
                  <span className={cls("tabular-nums", isBalanced ? "text-secondary" : isMinor ? "text-tertiary" : "text-error")}>{fmt(result.discrepancy)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-end">
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 active:scale-95 transition-all">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">New Cash Reconciliation</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-outline mb-1.5 block font-bold uppercase tracking-wider">Period Start</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-outline mb-1.5 block font-bold uppercase tracking-wider">Period End</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-outline mb-1.5 block font-bold uppercase tracking-wider">Counted Cash ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">$</span>
              <input type="number" step="0.01" min="0.01" value={countedCash} onChange={(e) => setCountedCash(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-7 pr-3 outline-none focus:ring-1 focus:ring-primary text-sm font-data-table" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-outline mb-1.5 block font-bold uppercase tracking-wider">Notes <span className="text-outline/60">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-sm resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span><span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {saving ? "Submitting..." : "Submit Count"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 8: BUDGETS
// ─────────────────────────────────────────────────────────────

function BudgetsTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const q = useQuery({
    queryKey: ["reports-budget-status", monthStart],
    queryFn: () => reportsApi.budgetStatus(monthStart),
    enabled: !!accessToken,
  });

  const data: BudgetStatusItem[] = q.data ?? [];

  function navigateMonth(delta: number) {
    const d = new Date(monthStart + "T00:00:00");
    d.setMonth(d.getMonth() + delta);
    setMonthStart(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }

  const monthLabel = new Date(monthStart + "T00:00:00").toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const exceededCount = data.filter((b) => b.exceeded).length;

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (q.error) return <ErrorMessage message={t("common.failedToLoad")} />;

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("budget.budgetStatus")}</p>
          {exceededCount > 0 && (
            <span className="text-[10px] bg-error/15 text-error px-2 py-0.5 rounded font-bold">{exceededCount} {t("common.total")}</span>
          )}
        </div>
        <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg p-1">
          <button onClick={() => navigateMonth(-1)} className="px-2 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="px-4 py-1.5 rounded-md text-sm text-primary font-semibold min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={() => navigateMonth(1)} className="px-2 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {data.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">account_balance_wallet</span>
            <p className="text-sm text-on-surface-variant">{t("budget.noBudgetsForMonth")}</p>
          </div>
        ) : (
          data.map((item) => {
            const limit = parseFloat(String(item.monthly_limit));
            const spent = typeof item.actual_spent === "number" ? item.actual_spent : parseFloat(String(item.actual_spent));
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            return (
              <div key={item.category} className="bg-surface-container-low border border-outline-variant rounded-xl p-card-padding hover:border-primary/15 transition-all">
                <div className="flex justify-between items-start mb-stack-md">
                  <span className="text-label-caps text-label-caps text-on-surface-variant uppercase">{item.category}</span>
                  <span className={cls("text-xs font-bold flex items-center gap-1", item.exceeded ? "text-error" : "text-secondary")}>
                    <span className="material-symbols-outlined text-sm">{item.exceeded ? "error" : "check_circle"}</span>
                    {item.exceeded ? t("common.total") : t("budget.onTrack")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={cls("font-data-table text-2xl font-bold", item.exceeded ? "text-error" : "text-on-surface")}>{fmt(spent)}</span>
                  <span className="text-sm text-on-surface-variant">{t("common.amount")}</span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-on-surface-variant mb-1.5">
                    <span>{t("common.filter")}: {pct.toFixed(0)}%</span>
                    <span>{t("budget.monthlyLimitLabel")}: {fmt(limit)}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className={cls("h-full rounded-full transition-all", item.exceeded ? "bg-error" : "bg-secondary")} style={{ width: `${pct}%`, boxShadow: item.exceeded ? "0 0 8px rgba(255,180,171,0.3)" : "0 0 8px rgba(73,223,162,0.3)" }} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-on-surface-variant">
                  {t("common.total")}: <span className={cls("font-bold", parseFloat(String(item.remaining)) < 0 ? "text-error" : "text-secondary")}>{fmt(item.remaining)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "overview", label: t("reports.overview"), icon: "dashboard" },
    { id: "pnl", label: t("reports.pnl"), icon: "account_balance" },
    { id: "cashflow", label: t("reports.cashflow"), icon: "water_drop" },
    { id: "locations", label: t("reports.locations"), icon: "store" },
    { id: "anomalies", label: t("reports.anomalies"), icon: "emergency" },
    { id: "credit", label: t("reports.credit"), icon: "credit_score" },
    { id: "reconciliation", label: t("reports.reconciliation"), icon: "fact_check" },
    { id: "budgets", label: t("reports.budgets"), icon: "account_balance_wallet" },
  ];

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-stack-lg flex-wrap gap-3">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{t("reports.title")}</h1>
          <p className="text-on-surface-variant mt-1 text-sm">{t("reports.description")}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex border-b border-outline-variant gap-6 overflow-x-auto hide-scroll sticky top-0 bg-background/95 backdrop-blur-sm z-30 pt-2 mb-stack-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cls(
              "pb-3 font-label-caps text-label-caps uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id ? "tab-active text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "pnl" && <PnLTab />}
      {activeTab === "cashflow" && <CashFlowTab />}
      {activeTab === "locations" && <LocationsTab />}
      {activeTab === "anomalies" && <AnomaliesTab />}
      {activeTab === "credit" && <CreditRiskTab />}
      {activeTab === "reconciliation" && <ReconciliationTab />}
      {activeTab === "budgets" && <BudgetsTab />}
    </div>
  );
}
