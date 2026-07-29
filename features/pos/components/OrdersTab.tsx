"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatNumber, formatDateTime, formatDate } from "@/lib/format";
import { ordersApi } from "@/features/orders/api";
import type { Order, OrdersSummary } from "@/features/orders/types";
import OrderDetailPanel from "./OrderDetailPanel";
import RefundModal from "./RefundModal";

const PAGE_SIZE = 10;

function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

function mondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function firstOfLastMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

const DEFAULT_START = toDateStr(firstOfLastMonth(today()));
const DEFAULT_END = toDateStr(today());



function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  let color = "";
  let labelKey = "";
  if (status === "COMPLETED") { color = "bg-secondary/10 text-secondary border-secondary/20"; labelKey = "order.status.COMPLETED"; }
  else if (status === "REFUNDED") { color = "bg-error/10 text-error border-error/20"; labelKey = "order.status.REFUNDED"; }
  else if (status === "PARTIALLY_REFUNDED") { color = "bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20"; labelKey = "order.status.PARTIALLY_REFUNDED"; }
  else { color = "bg-outline/10 text-outline border-outline/20"; labelKey = status; }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-data-table ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {t(labelKey)}
    </span>
  );
}

function SummaryCard({ icon, label, value, color, loading }: { icon: string; label: string; value: string; color: string; loading: boolean }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-w-0">
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-16 rounded bg-surface-container-highest/60" />
          <div className="h-6 w-20 rounded bg-surface-container-highest/60" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
            <span className="text-[10px] text-outline font-medium truncate">{label}</span>
          </div>
          <span className={`font-data-table text-lg font-bold ${color}`}>{value}</span>
        </>
      )}
    </div>
  );
}

export default function OrdersTab() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [detailKey, setDetailKey] = useState(0);

  const activePreset = useMemo(() => {
    if (startDate === toDateStr(today()) && endDate === toDateStr(today())) return "today";
    if (startDate === toDateStr(mondayOfWeek(today())) && endDate === toDateStr(today())) return "week";
    if (startDate === toDateStr(firstOfMonth(today())) && endDate === toDateStr(today())) return "month";
    return null;
  }, [startDate, endDate]);

  function setDateRange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const params: Record<string, string | number | boolean | null | undefined> = {
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      };
      const result = await ordersApi.getOverview(params);
      setSummary(result.summary);
    } catch {
      setSummary(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [startDate, endDate]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number | boolean | null | undefined> = {
        page, size: PAGE_SIZE,
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      };
      if (statusFilter) params.status = statusFilter;

      const result = await ordersApi.list(params);
      setOrders(result.items);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.failedToLoad"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  function handleFilterChange() {
    setPage(1);
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order);
    setDetailKey((k) => k + 1);
  }

  function handleRefundClick(order: Order) {
    setRefundingOrder(order);
  }

  function handleRefundSuccess() {
    setRefundingOrder(null);
    setSelectedOrder(null);
    fetchOrders();
    fetchOverview();
  }

  function handleClearFilters() {
    setStatusFilter("");
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    setPage(1);
  }

  const refundedCount = (summary?.refunded_orders ?? 0) + (summary?.partially_refunded_orders ?? 0);

  return (
    <div className="relative h-full flex flex-col bg-surface">
      {/* Summary Cards */}
      <div className="shrink-0 px-container-margin pt-3 pb-2 bg-surface">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <SummaryCard
            icon="receipt_long"
            label={t("stats.totalOrders")}
            value={String(summary?.total_orders ?? 0)}
            color="text-on-surface-variant"
            loading={overviewLoading}
          />
          <SummaryCard
            icon="check_circle"
            label={t("pos.completed")}
            value={String(summary?.completed_orders ?? 0)}
            color="text-secondary"
            loading={overviewLoading}
          />
          <SummaryCard
            icon="currency_exchange"
            label={t("pos.refunded")}
            value={String(refundedCount)}
            color="text-error"
            loading={overviewLoading}
          />
          <SummaryCard
            icon="payments"
            label={t("stats.totalSales")}
            value={formatCurrency(summary?.total_sales)}
            color="text-primary"
            loading={overviewLoading}
          />
          <SummaryCard
            icon="account_balance"
            label={t("dashboard.netSales")}
            value={formatCurrency(summary?.net_sales)}
            color="text-secondary"
            loading={overviewLoading}
          />
          <SummaryCard
            icon="trending_up"
            label={t("stats.averageOrder")}
            value={formatCurrency(summary?.average_order_value)}
            color="text-primary"
            loading={overviewLoading}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 px-2 sm:px-container-margin py-2 sm:py-3 border-y border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-label-caps text-outline text-[10px] hidden sm:inline">{t("common.status")}</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
              className="bg-surface border border-outline-variant rounded-lg py-1.5 px-2 sm:px-3 text-[10px] sm:text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary max-w-[90px] sm:max-w-none"
            >
              <option value="">{t("common.all")}</option>
              <option value="completed">{t("pos.completed")}</option>
              <option value="refunded">{t("pos.refunded")}</option>
            </select>
          </div>

          <div className="w-px h-5 sm:h-6 bg-outline-variant/50 shrink-0" />

          {/* Date Presets */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[
              { key: "today", label: t("date.today"), start: toDateStr(today()), end: toDateStr(today()) },
              { key: "week", label: t("date.thisWeek"), start: toDateStr(mondayOfWeek(today())), end: toDateStr(today()) },
              { key: "month", label: t("date.thisMonth"), start: toDateStr(firstOfMonth(today())), end: toDateStr(today()) },
            ].map((preset) => (
              <button
                key={preset.key}
                onClick={() => setDateRange(preset.start, preset.end)}
                className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all ${
                  activePreset === preset.key
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 sm:h-6 bg-outline-variant/50 shrink-0" />

          {/* Date Range */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-label-caps text-outline text-[10px] hidden sm:inline">{t("common.startDate")}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
              className="bg-surface border border-outline-variant rounded-lg py-1.5 px-1.5 sm:px-3 text-[10px] sm:text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary [color-scheme:dark] w-[100px] sm:w-auto"
            />
            <span className="text-outline text-[10px] sm:text-xs">→</span>
            <span className="text-label-caps text-outline text-[10px] hidden sm:inline">{t("common.endDate")}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
              className="bg-surface border border-outline-variant rounded-lg py-1.5 px-1.5 sm:px-3 text-[10px] sm:text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary [color-scheme:dark] w-[100px] sm:w-auto"
            />
          </div>

          <div className="w-px h-5 sm:h-6 bg-outline-variant/50 shrink-0" />

          <div className="text-xs text-on-surface-variant whitespace-nowrap">
            <span className="font-data-table">{total}</span>
            <span className="hidden sm:inline"> {t("common.items")}</span>
          </div>

          {(statusFilter || startDate !== DEFAULT_START || endDate !== DEFAULT_END) && (
            <button onClick={handleClearFilters} className="text-xs text-error hover:underline">
              {t("common.refresh")}
            </button>
          )}

          {pages > 1 && (
            <div className="text-[10px] sm:text-xs text-on-surface-variant font-data-table">
              {t("common.page")} {page}/{pages}
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-container-margin space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-3 sm:p-5 animate-pulse">
                <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_100px_160px_80px] gap-2 sm:gap-4 items-center">
                  <div className="h-4 w-24 rounded bg-surface-container-highest/60" />
                  <div className="h-5 w-24 rounded-full bg-surface-container-highest/60" />
                  <div className="h-4 w-16 rounded bg-surface-container-highest/60" />
                  <div className="h-4 w-28 rounded bg-surface-container-highest/60" />
                  <div className="h-4 w-12 rounded bg-surface-container-highest/60" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-error mb-3">error</span>
            <p className="text-body-md text-error">{error}</p>
              <button onClick={fetchOrders} className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold active:scale-95 transition-transform">
                {t("common.retry")}
              </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline mb-3">receipt_long</span>
            <p className="text-body-md text-on-surface-variant">{t("pos.noOrders")}</p>
            <p className="text-xs text-outline mt-1">{t("common.noResults")}</p>
          </div>
        ) : (
          <div className="p-container-margin space-y-2">
                {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleViewOrder(order)}
                className="bg-surface-container-low border border-outline-variant rounded-xl p-3 sm:p-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_100px_160px_80px] gap-2 sm:gap-4 items-center hover:border-primary/30 hover:bg-surface-container transition-all cursor-pointer group"
              >
                {/* ID */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">receipt</span>
                  <span className="font-data-table text-sm text-on-surface truncate">#{order.id.slice(0, 8)}</span>
                </div>

                {/* Status */}
                <StatusBadge status={order.status} t={t} />

                {/* Total */}
                <span className="font-data-table text-sm text-primary text-right">{formatCurrency(order.total)}</span>

                {/* Date */}
                <span className="text-xs text-on-surface-variant font-data-table">{formatDateTime(order.created_at)}</span>

                {/* Actions */}
                <div className="flex gap-1.5 justify-end sm:justify-end col-span-2 sm:col-span-1">
                  <span
                    onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary transition-all cursor-pointer active:scale-95"
                  >
                    {t("common.viewDetails")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && !loading && !error && (
        <div className="shrink-0 px-2 sm:px-container-margin py-3 border-t border-outline-variant bg-surface-container-low flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs text-on-surface-variant font-data-table">
            <span className="hidden sm:inline">{t("common.showing")} </span>
            {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
            <span className="hidden sm:inline"> {t("common.of")} {total}</span>
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-surface border border-outline-variant text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 3, pages - 6));
              const p = start + i;
              if (p > pages) return null;
              const isFar = Math.abs(p - page) > 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isFar ? 'hidden sm:flex' : 'flex'
                  } ${
                    p === page
                      ? "bg-primary text-on-primary"
                      : "bg-surface border border-outline-variant text-outline hover:bg-surface-variant/40"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-surface border border-outline-variant text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Slide-in Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40" style={{ top: "64px" }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="absolute top-0 left-0 bottom-0 w-full sm:w-[480px] md:w-[500px] max-w-[500px] bg-surface-container-high border-r border-outline-variant shadow-2xl flex flex-col" style={{ animation: "slide-in-right 0.3s ease-out" }}>
            <OrderDetailPanel
              key={detailKey}
              orderId={selectedOrder.id}
              initialOrder={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onRefund={(order) => handleRefundClick(order)}
            />
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundingOrder && (
        <RefundModal
          order={refundingOrder}
          onClose={() => setRefundingOrder(null)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
}
