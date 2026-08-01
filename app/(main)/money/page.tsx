"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { reportsApi, type CashLedgerEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import DateRangePopover from "@/components/layout/DateRangePopover";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useTranslation } from "react-i18next";
import ExportButton, { type ExcelColumn } from "@/components/export/ExportButton";

const PAGE_SIZE = 25;

const ENTRY_TYPE_CONFIG: Record<string, { icon: string; badgeClass: string; labelKey: string }> = {
  SALE: { icon: "point_of_sale", badgeClass: "text-primary bg-primary/10 border-primary/20", labelKey: "sale" },
  PAYMENT: { icon: "point_of_sale", badgeClass: "text-primary bg-primary/10 border-primary/20", labelKey: "sale" },
  ORDER_PAYMENT: { icon: "point_of_sale", badgeClass: "text-primary bg-primary/10 border-primary/20", labelKey: "sale" },
  REFUND: { icon: "undo", badgeClass: "text-error bg-error/10 border-error/20", labelKey: "refund" },
  EXPENSE: { icon: "receipt_long", badgeClass: "text-error bg-error/10 border-error/20", labelKey: "expense" },
  VENDOR_PAYMENT: { icon: "conveyor_belt", badgeClass: "text-tertiary bg-tertiary/10 border-tertiary/20", labelKey: "vendorPayment" },
  OWNER_DRAW: { icon: "money_off", badgeClass: "text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20", labelKey: "ownerDraw" },
  OWNER_WITHDRAWAL: { icon: "money_off", badgeClass: "text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20", labelKey: "ownerDraw" },
  OWNER_CONTRIBUTION: { icon: "account_balance", badgeClass: "text-secondary bg-secondary/10 border-secondary/20", labelKey: "ownerContribution" },
  STORE_CREDIT: { icon: "payments", badgeClass: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20", labelKey: "storeCredit" },
  STORE_CREDIT_ISSUE: { icon: "payments", badgeClass: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20", labelKey: "storeCredit" },
  CREDIT_ISSUED: { icon: "payments", badgeClass: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20", labelKey: "storeCredit" },
  RECONCILIATION: { icon: "fact_check", badgeClass: "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20", labelKey: "reconciliation" },
  DEPOSIT: { icon: "add_circle", badgeClass: "text-secondary bg-secondary/10 border-secondary/20", labelKey: "deposit" },
  WITHDRAWAL: { icon: "remove_circle", badgeClass: "text-error bg-error/10 border-error/20", labelKey: "withdrawal" },
  ADJUSTMENT: { icon: "tune", badgeClass: "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20", labelKey: "adjustment" },
};

const FALLBACK_BADGE_CLASS = "text-on-surface-variant bg-surface-container-high border-outline-variant";

function toNum(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

function getEntryTypeConfig(entryType: string) {
  const normalized = entryType.trim().toUpperCase().replace(/\s+/g, "_");
  return ENTRY_TYPE_CONFIG[normalized];
}

export default function MoneyPage() {
  const { t } = useTranslation();
  return (
    <div className="p-container-margin flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{t("money.title")}</h1>
            <p className="text-on-surface-variant mt-1 text-sm">{t("money.description")}</p>
          </div>
          <DateRangePopover />
        </div>
        <CashLedgerTable />
      </div>
    </div>
  );
}

function CashLedgerTable() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const [page, setPage] = useState(1);
  const [rangeKey, setRangeKey] = useState(() => `${startDate}|${endDate}`);

  const currentRangeKey = `${startDate}|${endDate}`;
  if (rangeKey !== currentRangeKey) {
    setRangeKey(currentRangeKey);
    setPage(1);
  }

  const query = useQuery({
    queryKey: queryKeys.reports.cashLedger({ start_date: startDate, end_date: endDate, page, size: PAGE_SIZE }),
    queryFn: () => reportsApi.cashLedger({ start_date: startDate, end_date: endDate, page, size: PAGE_SIZE }),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
  });

  const entries = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = query.data?.pages ?? 1;
  const isLoading = query.isLoading || query.isFetching;
  const hasError = !!query.error;

  function handlePageChange(next: number) {
    setPage(Math.min(Math.max(1, next), Math.max(1, pages)));
  }

  const exportColumns = useMemo<ExcelColumn<CashLedgerEntry>[]>(
    () => [
      { header: t("common.date"), type: "date", value: (e) => e.created_at },
      {
        header: t("money.entryType"),
        value: (e) => {
          const config = getEntryTypeConfig(e.entry_type);
          return config ? t(`money.entryTypes.${config.labelKey}`) : e.entry_type;
        },
      },
      { header: t("common.amount"), type: "currency", value: (e) => toNum(e.amount) },
      { header: t("money.referenceTable"), value: (e) => e.reference_table ?? "" },
      { header: t("money.referenceId"), value: (e) => e.reference_id ?? "" },
      { header: t("money.location"), value: (e) => e.location_name ?? e.location_id ?? "" },
      { header: t("money.createdBy"), value: (e) => e.created_by ?? e.created_by_email ?? "" },
      { header: t("common.notes"), value: (e) => e.notes ?? "" },
    ],
    [t]
  );

  const exportFetch = useCallback(
    async (page: number, size: number) =>
      reportsApi.cashLedger({ start_date: startDate, end_date: endDate, page, size }),
    [startDate, endDate]
  );

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
      <div className="px-card-padding py-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
        <p className="font-label-caps text-label-caps text-outline uppercase">{t("money.cashLedger")}</p>
        <div className="flex items-center gap-2">
          {!isLoading && !hasError && total > 0 && (
            <ExportButton
              columns={exportColumns}
              fetchPage={exportFetch}
              fileName="Money"
              batchSize={100}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors text-[11px] font-bold"
            />
          )}
          {!isLoading && !hasError && (
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
              {total} {t("common.items")}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <LedgerTable>
          <LedgerSkeleton />
        </LedgerTable>
      ) : hasError ? (
        <LedgerError onRetry={() => query.refetch()} />
      ) : entries.length === 0 ? (
        <LedgerEmpty />
      ) : (
        <>
          <LedgerTable>
            <tbody className="divide-y divide-outline-variant/50">
              {entries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </LedgerTable>
          <Pagination
            page={page}
            pages={pages}
            total={total}
            size={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

function LedgerTable({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant">
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("common.date")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("money.entryType")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase text-right whitespace-nowrap">{t("common.amount")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("money.referenceTable")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("money.referenceId")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("money.location")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("money.createdBy")}</th>
            <th className="px-card-padding py-4 font-label-caps text-[10px] text-outline uppercase whitespace-nowrap">{t("common.notes")}</th>
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

function LedgerRow({ entry }: { entry: CashLedgerEntry }) {
  const amount = toNum(entry.amount);
  const isInflow = amount >= 0;
  const config = getEntryTypeConfig(entry.entry_type);
  const { t } = useTranslation();

  return (
    <tr className="hover:bg-surface-container-high transition-colors">
      <td className="px-card-padding py-4 font-data-table text-on-surface-variant text-sm whitespace-nowrap">{formatDateTime(entry.created_at)}</td>
      <td className="px-card-padding py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border whitespace-nowrap ${config ? config.badgeClass : FALLBACK_BADGE_CLASS}`}>
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{config?.icon ?? "receipt_long"}</span>
          {config ? t(`money.entryTypes.${config.labelKey}`) : entry.entry_type || "—"}
        </span>
      </td>
      <td className={`px-card-padding py-4 font-data-table text-right whitespace-nowrap ${isInflow ? "text-secondary" : "text-error"}`}>
        {isInflow ? "+" : "-"}{formatCurrency(Math.abs(amount))}
      </td>
      <td className="px-card-padding py-4 text-on-surface text-sm">{entry.reference_table ?? "—"}</td>
      <td className="px-card-padding py-4 text-on-surface-variant text-xs font-mono">{entry.reference_id ?? "—"}</td>
      <td className="px-card-padding py-4 text-on-surface-variant text-sm">{entry.location_name ?? entry.location_id ?? "—"}</td>
      <td className="px-card-padding py-4 text-on-surface-variant text-sm">{entry.created_by ?? entry.created_by_email ?? "—"}</td>
      <td className="px-card-padding py-4 text-on-surface-variant text-xs max-w-[160px] truncate" title={entry.notes ?? undefined}>{entry.notes ?? "—"}</td>
    </tr>
  );
}

function LedgerSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-outline-variant/10">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-card-padding py-4">
              <div
                className="h-4 rounded bg-surface-container-highest/50 animate-pulse"
                style={{ width: j === 2 ? "55%" : j % 3 === 0 ? "70%" : "90%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function LedgerEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40 mb-3">savings</span>
      <p className="text-sm text-on-surface-variant">{t("money.noEntries")}</p>
    </div>
  );
}

function LedgerError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-error text-3xl mb-3">error_outline</span>
      <p className="text-sm text-on-surface-variant">{t("common.failedToLoad")}</p>
      <button
        onClick={onRetry}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-wider hover:text-primary hover:bg-surface-container-highest transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">refresh</span>
        {t("common.retry")}
      </button>
    </div>
  );
}

function Pagination({
  page,
  pages,
  total,
  size,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  const canGoPrevious = page > 1;
  const canGoNext = page < pages;

  return (
    <div className="px-card-padding py-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
      <span className="text-xs font-body-md text-on-surface-variant">
        {t("common.showing")} <span className="font-bold text-on-surface">{start}</span>&ndash;{end} {t("common.of")} {total} {t("common.items")}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          {t("money.previous")}
        </button>
        <span className="text-xs text-on-surface-variant px-2 whitespace-nowrap">
          {t("common.page")} <span className="font-bold text-on-surface">{page}</span> {t("common.of")} <span className="font-bold text-on-surface">{pages || 1}</span>
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          {t("money.next")}
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
      </div>
    </div>
  );
}
