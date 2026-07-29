"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { storeCreditApi } from "@/features/store-credit/api";
import type { StoreCreditOverview } from "@/features/store-credit/types";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

const ENTRY_ICONS: Record<string, string> = {
  ISSUED: "undo",
  REDEEMED: "shopping_bag",
  EXPIRED: "schedule",
  ADJUSTMENT: "tune",
};

const ENTRY_LABELS: Record<string, string> = {
  ISSUED: "Store Credit Issued",
  REDEEMED: "Store Credit Redeemed",
  EXPIRED: "Credit Expired",
  ADJUSTMENT: "Manual Adjustment",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function todayISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

function thirtyDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function StoreCreditCustomerPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [data, setData] = useState<StoreCreditOverview | null>(null);
  const [customerName, setCustomerName] = useState("Customer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [startDate, setStartDate] = useState(() => toDateInputValue(thirtyDaysAgoISO()));
  const [endDate, setEndDate] = useState(() => toDateInputValue(todayISO()));

  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = startDate ? new Date(startDate).toISOString() : undefined;
        const e = endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined;
        const [overview, bal] = await Promise.all([
          storeCreditApi.getOverview(customerId, s, e),
          storeCreditApi.getBalance(customerId),
        ]);
        if (cancelled) return;
        setData(overview);
        setCustomerName(bal.customer_name || "Customer");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load store credit data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerId, startDate, endDate, fetchKey]);

  const summary = data?.summary;
  const history = useMemo(() => data?.ledger ?? [], [data?.ledger]);

  const totalIssued = toNum(summary?.total_issued);
  const totalRedeemed = toNum(summary?.total_redeemed);
  const usagePct = totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0;

  const filteredHistory = useMemo(
    () =>
      searchQuery
        ? history.filter((e) => (e.reference_table ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
        : history,
    [history, searchQuery],
  );

  const netCredit = toNum(summary?.net_credit ?? 0);

  if (loading) {
    return (
      <div className="p-container-margin flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-container-margin flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-error text-4xl">error</span>
          <p className="text-on-surface-variant text-sm">{error}</p>
          <button onClick={() => setFetchKey((k) => k + 1)} className="text-primary underline text-sm">{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container-margin space-y-stack-lg max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/store-credit")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-variant transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">{customerName}</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {t("common.active")}
            </span>
          </div>
          <p className="font-data-table text-on-surface-variant flex items-center gap-2 ml-11">
            {t("common.id")}: <span className="text-on-surface font-body-md">{customerId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            {t("common.export")}
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            {t("storeCredit.issueCredit")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 w-full md:w-fit flex-wrap md:flex-nowrap">
        <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-transparent border-none outline-none text-xs font-body-md text-on-surface w-[120px]"
        />
        <span className="text-outline text-xs">—</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-transparent border-none outline-none text-xs font-body-md text-on-surface w-[120px]"
        />
        <button
          onClick={() => setFetchKey((k) => k + 1)}
          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all border border-primary/20"
        >
          {t("common.apply")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
        <div className="md:col-span-2 lg:col-span-2 glass-card rounded-xl p-card-padding flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
            <span className="material-symbols-outlined text-7xl text-primary">account_balance_wallet</span>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">{t("storeCredit.creditHistory")}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display-lg text-display-lg font-bold font-data-table text-on-surface">
                {formatCurrency(netCredit)}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/20">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                {usagePct}% {t("storeCredit.health")}
              </span>
            </div>
          </div>
          <div className="mt-8 flex gap-8">
            <div>
              <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">{t("storeCredit.totalDeposited")}</span>
              <span className="font-data-table text-body-lg text-on-surface mt-1">{formatCurrency(totalIssued)}</span>
            </div>
            <div className="w-px h-8 bg-outline-variant" />
            <div>
              <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">{t("storeCredit.totalWithdrawn")}</span>
              <span className="font-data-table text-body-lg text-on-surface mt-1">{formatCurrency(totalRedeemed)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-card-padding flex flex-col justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">{t("storeCredit.health")}</span>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 * (1 - usagePct / 100)}
                    strokeLinecap="round"
                    className="text-secondary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-data-table text-xs text-on-surface">{usagePct}%</div>
              </div>
              <div className="space-y-1">
                <span className="block font-body-md text-on-surface font-semibold">{usagePct < 50 ? t("budget.notStarted") : t("budget.onTrack")}</span>
                <span className="block text-xs text-on-surface-variant">
                  {history.length > 0 ? `${t("common.date")}: ${formatDate(history[0].created_at)}` : t("common.noResults")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-card-padding flex flex-col justify-between">
          <div>
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">{t("common.customRange")}</span>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-body-md">{t("storeCredit.issue")}</span>
                <span className="text-secondary font-bold font-data-table">{summary?.issued_count ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-body-md">{t("storeCredit.withdraw")}</span>
                <span className="text-error font-bold font-data-table">{summary?.redeemed_count ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-body-md">{t("common.edit")}</span>
                <span className="text-primary font-bold font-data-table">{summary?.adjustment_count ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-outline-variant/50">
                <span className="text-on-surface-variant font-body-md">Total</span>
                <span className="text-on-surface font-bold font-data-table">{summary?.total_transactions ?? 0} {t("common.total")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-stack-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("storeCredit.wallet")}</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2 text-xs font-body-md focus:border-primary transition-all outline-none w-52"
              placeholder={t("search.placeholder")}
            />
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase">{t("common.date")}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase">{t("common.type")}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase">{t("common.id")}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase text-right">{t("common.amount")}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase text-right">{t("storeCredit.balance")}</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase">{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                      {searchQuery ? t("common.noResults") : t("storeCredit.noTransactions")}
                    </td>
                  </tr>
                )}
                {filteredHistory.map((entry, idx) => {
                  const amount = toNum(entry.amount);
                  const isCredit = amount >= 0;
                  const entryKey = entry.entry_type?.toUpperCase() ?? "";
                  const icon = ENTRY_ICONS[entryKey] ?? "receipt_long";
                  const label = ENTRY_LABELS[entryKey] ?? entry.entry_type ?? "Transaction";

                  let runningBalance = 0;
                  for (let i = 0; i <= idx; i++) {
                    runningBalance += toNum(filteredHistory[i].amount);
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="px-6 py-4 font-data-table text-on-surface-variant text-sm">
                        {formatDate(entry.created_at)}
                        <span className="text-[10px] block opacity-50 font-body-md">{formatTime(entry.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCredit ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-error/10 text-error border border-error/20"}`}>
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                          </div>
                          <span className="font-body-md text-on-surface text-sm">{label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-data-table text-on-surface text-sm">{entry.reference_table ?? "—"}</span>
                        {entry.notes && <span className="text-[10px] block text-on-surface-variant font-body-md">{entry.notes}</span>}
                      </td>
                      <td className={`px-6 py-4 font-data-table text-right ${isCredit ? "text-secondary" : "text-error"}`}>
                        {isCredit ? "+" : ""}{formatCurrency(Math.abs(amount))}
                      </td>
                      <td className="px-6 py-4 font-data-table text-on-surface text-right">{formatCurrency(runningBalance)}</td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs font-body-md">{entry.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <span className="text-xs font-body-md text-on-surface-variant">
              {t("common.showing")} {filteredHistory.length} {t("common.of")} {history.length} {t("common.items")}
            </span>
          </div>
        </div>
      </div>

      {showIssueModal && (
        <IssueCreditModal
          customerId={customerId}
          customerName={customerName}
          onClose={() => setShowIssueModal(false)}
          onIssued={() => setFetchKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function IssueCreditModal({
  customerId, customerName, onClose, onIssued,
}: {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onIssued: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid positive amount");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await storeCreditApi.issue(customerId, {
        amount: parsed,
        reference_table: reference || undefined,
        notes: notes || undefined,
      });
      onIssued();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue store credit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("storeCredit.issueTitle")}</h3>
            <p className="text-[12px] text-outline mt-0.5 font-body-md">{customerName}</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.amount")}</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary text-headline-sm font-data-table text-center transition-colors" placeholder="0.00" />
          </div>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.id")} ({t("common.optional")})</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 outline-none focus:border-primary text-sm transition-colors"               placeholder={t("storeCredit.reasonPlaceholder")} />
          </div>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.notes")} ({t("common.optional")})</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 outline-none focus:border-primary text-sm resize-none h-20 transition-colors"               placeholder={t("storeCredit.reasonPlaceholder")} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-6 bg-surface-container-high/80 border-t border-outline-variant flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm font-bold">{t("common.cancel")}</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("storeCredit.issueCredit")}
          </button>
        </div>
      </div>
    </div>
  );
}
