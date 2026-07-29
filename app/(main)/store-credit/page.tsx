"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customersApi } from "@/features/customers/api";
import { storeCreditApi, poolApi } from "@/features/store-credit/api";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import DateRangePopover from "@/components/layout/DateRangePopover";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";
import type { PoolOverview, StoreCreditBalancesPaginatedResponse, StoreCreditBalanceItem } from "@/features/store-credit/types";
import type { CustomerListItem } from "@/features/customers/types";

type Tab = "pool" | "customers";

const POOL_ENTRY_COLORS: Record<string, string> = {
  DEPOSIT: "text-secondary bg-secondary/10 border-secondary/20",
  WITHDRAWAL: "text-error bg-error/10 border-error/20",
  CREDIT_ISSUED: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  CREDIT_RETURNED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

const POOL_ENTRY_ICONS: Record<string, string> = {
  DEPOSIT: "account_balance",
  WITHDRAWAL: "money_off",
  CREDIT_ISSUED: "arrow_outward",
  CREDIT_RETURNED: "reply",
};

const POOL_ENTRY_LABELS: Record<string, string> = {
  DEPOSIT: "إيداع",
  WITHDRAWAL: "سحب",
  CREDIT_ISSUED: "صادر للعميل",
  CREDIT_RETURNED: "عائد من العميل",
};
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

export default function StoreCreditPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("pool");

  return (
    <div className="p-container-margin flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-stack-lg">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">{t("storeCredit.title")}</h1>
          <p className="text-on-surface-variant mt-1 text-sm">{t("storeCredit.wallet")}</p>
        </div>

        <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant w-fit overflow-x-auto">
          <button onClick={() => setTab("pool")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "pool"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}>
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            {t("storeCredit.poolDashboard")}
          </button>
          <button onClick={() => setTab("customers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === "customers"
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}>
            <span className="material-symbols-outlined text-[16px]">group</span>
            {t("storeCredit.customerCredits")}
          </button>
        </div>

        {tab === "pool" ? <PoolDashboard /> : <CustomerCredits />}
      </div>
    </div>
  );
}

function PoolDashboard() {
  const { t } = useTranslation();
  const { startDate, endDate, displayLabel } = useDateRange();
  const [overview, setOverview] = useState<PoolOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"deposit" | "withdraw" | "issue" | "return" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ov = await poolApi.getOverview(
          startDate ? new Date(startDate).toISOString() : undefined,
          endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
        );
        if (!cancelled) setOverview(ov);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load pool overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  const summary = overview?.summary;
  const ledger = overview?.ledger ?? [];
  const balance = toNum(overview?.pool?.balance);

  const totalDeposits = toNum(summary?.total_deposits);
  const totalIssued = toNum(summary?.total_issued_to_customers);
  const totalWithdrawals = toNum(summary?.total_withdrawals);
  const totalPoolActivity = totalDeposits + totalWithdrawals;
  const depositRatio = totalPoolActivity > 0 ? totalDeposits / totalPoolActivity : 0.5;
  const issuanceRate = totalDeposits > 0 ? (totalIssued / totalDeposits) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-stack-lg">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-surface-container-highest/60 animate-pulse" />
          <div className="h-9 w-44 rounded-lg bg-surface-container-highest/60 animate-pulse" />
        </div>
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest/60" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 rounded bg-surface-container-highest/60" />
                  <div className="h-8 w-40 rounded bg-surface-container-highest/60" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 w-32 rounded-xl bg-surface-container-highest/60" />)}
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-gutter">
            {[1, 2].map((i) => <div key={i} className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse"><div className="h-12 rounded bg-surface-container-highest/60" /></div>)}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-surface-container-highest animate-pulse"><div className="h-10 w-24 rounded bg-surface-container-highest/60" /></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-error text-3xl">error</span>
          <p className="text-sm text-on-surface-variant mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("storeCredit.poolDashboard")}</h2>
        <DateRangePopover />
      </div>

      {/* Hero: Balance Card + Mini Stats */}
      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8 flex">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding w-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl">account_balance</span>
              </div>
              <div className="flex-1">
                  <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest">{t("storeCredit.poolBalance")}</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-display-lg text-display-lg text-on-surface">{formatCurrency(balance)}</span>
                    {balance > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                        <span className="material-symbols-outlined text-xs">trending_up</span>
                        {t("common.active")}
                      </span>
                    )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => setModal("deposit")}
                className="flex items-center gap-2 bg-secondary text-[#031f12] px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                {t("storeCredit.deposit")}
              </button>
              <button onClick={() => setModal("withdraw")}
                className="flex items-center gap-2 bg-error text-[#690005] px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                {t("storeCredit.withdraw")}
              </button>
              <button onClick={() => setModal("issue")}
                className="flex items-center gap-2 bg-[#fbbf24] text-[#0f172a] px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                {t("storeCredit.issue")}
              </button>
              <button onClick={() => setModal("return")}
                className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">reply</span>
                {t("storeCredit.return")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-l-secondary">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">{t("storeCredit.transactions")}</p>
              <span className="text-[10px] font-bold text-secondary">{ledger.length}</span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1">
              {totalDeposits > 0 ? formatCurrency(totalDeposits) : formatCurrency(0)} {t("storeCredit.depositAmount")}
            </p>
            <div className="mt-3 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${depositRatio * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>{t("storeCredit.deposit")}: {summary?.deposit_count ?? 0}</span>
                <span>{t("storeCredit.withdraw")}: {summary?.withdrawal_count ?? 0}</span>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-l-primary">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">{t("storeCredit.health")}</p>
              <span className="text-[10px] font-bold text-primary">{issuanceRate.toFixed(1)}%</span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1">
              {formatCurrency(totalIssued)} {t("storeCredit.issueTitle")}
            </p>
            <div className="mt-3 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(issuanceRate, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>{t("storeCredit.issue")}: {summary?.issued_count ?? 0}</span>
                <span>{t("storeCredit.return")}: {summary?.returned_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      {summary && (
        <div>
          <div className="flex items-baseline gap-2 mb-3 px-1">
            <p className="font-label-caps text-label-caps text-outline uppercase">{t("common.customRange")}</p>
            <p className="text-[10px] text-on-surface-variant/60">{displayLabel}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            <SummaryCard label={t("storeCredit.totalDeposited")} value={formatCurrency(totalDeposits)} count={summary.deposit_count ?? 0} accent="border-r-secondary" color="text-secondary" />
            <SummaryCard label={t("storeCredit.totalWithdrawn")} value={formatCurrency(totalWithdrawals)} count={summary.withdrawal_count ?? 0} accent="border-r-error" color="text-error" />
            <SummaryCard label={t("storeCredit.issueTitle")} value={formatCurrency(totalIssued)} count={summary.issued_count ?? 0} accent="border-r-[#fbbf24]" color="text-[#fbbf24]" />
            <SummaryCard label={t("storeCredit.returnTitle")} value={formatCurrency(toNum(summary.total_returned_from_customers))} count={summary.returned_count ?? 0} accent="border-r-[#3b82f6]" color="text-[#3b82f6]" />
          </div>
        </div>
      )}

      {/* Pool Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-baseline gap-2">
            <p className="font-label-caps text-label-caps text-outline uppercase">{t("storeCredit.transactions")}</p>
            <p className="text-[10px] text-on-surface-variant/60">{displayLabel}</p>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase">{t("common.date")}</th>
                  <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase">{t("common.type")}</th>
                  <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase text-right">{t("common.amount")}</th>
                  <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase">{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {ledger.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant text-sm">{t("storeCredit.noTransactions")}</td></tr>
                )}
                {ledger.map((entry) => {
                  const entryKey = entry.entry_type?.toUpperCase() ?? "";
                  const colorClass = POOL_ENTRY_COLORS[entryKey] ?? "text-on-surface-variant bg-surface-container-high border-outline-variant";
                  const icon = POOL_ENTRY_ICONS[entryKey] ?? "receipt_long";
                  const label = POOL_ENTRY_LABELS[entryKey] ?? entryKey;
                  const isInflow = entryKey === "DEPOSIT" || entryKey === "CREDIT_RETURNED";
                  return (
                    <tr key={entry.id} className="hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4 font-data-table text-on-surface-variant text-sm">{formatDate(entry.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${colorClass}`}>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                          {label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-data-table text-right ${isInflow ? "text-secondary" : "text-error"}`}>
                        {isInflow ? "+" : "-"}{formatCurrency(Math.abs(toNum(entry.amount)))}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs font-body-md">{entry.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal === "deposit" && <PoolDepositModal onClose={() => setModal(null)} onDone={() => { setModal(null); }} />}
      {modal === "withdraw" && <PoolWithdrawModal onClose={() => setModal(null)} onDone={() => { setModal(null); }} />}
      {modal === "issue" && <PoolIssueModal onClose={() => setModal(null)} onDone={() => { setModal(null); }} />}
      {modal === "return" && <PoolReturnModal onClose={() => setModal(null)} onDone={() => { setModal(null); }} />}
    </div>
  );
}

function CustomerCredits() {
  const { t } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<StoreCreditBalancesPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    storeCreditApi.getBalances({ page: 1, size: 50 })
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalBalance = data?.items.reduce((sum, c) => sum + toNum(c.balance), 0) ?? 0;
  const activeCount = data?.items.filter((c) => toNum(c.balance) > 0).length ?? 0;

  return (
    <div className="space-y-stack-md">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-l-primary">
          <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">{t("storeCredit.customerCount")}</p>
          <p className="font-headline-sm text-headline-sm text-on-surface mt-1">{data?.total ?? 0}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-l-secondary">
          <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">{t("storeCredit.balance")}</p>
          <p className="font-headline-sm text-headline-sm text-secondary mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-l-2 border-l-[#fbbf24]">
          <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">{t("storeCredit.totalBalance")}</p>
          <p className="font-headline-sm text-headline-sm text-[#fbbf24] mt-1">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase">{t("common.name")}</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase">{t("common.id")}</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase text-right">{t("storeCredit.balance")}</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase text-right">{t("common.status")}</th>
                <th className="px-6 py-4 font-label-caps text-[10px] text-outline uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-primary text-2xl animate-spin inline-block">progress_activity</span>
                  <p className="mt-2">{t("common.loading")}</p>
                </td></tr>
              )}
              {!loading && (!data || data.items.length === 0) && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">{t("storeCredit.noCustomerCredits")}</td></tr>
              )}
              {!loading && data?.items.map((customer) => (
                <tr key={customer.customer_id}
                  className="hover:bg-surface-container-high transition-colors group cursor-pointer"
                  onClick={() => router.push(`/store-credit/${customer.customer_id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant">
                        <span className="material-symbols-outlined text-sm text-outline">person</span>
                      </div>
                      <span className="font-data-table text-on-surface text-sm">{customer.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs font-body-md font-mono">{customer.customer_id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 font-data-table text-right">
                    <span className={toNum(customer.balance) > 0 ? "text-secondary" : "text-on-surface-variant"}>
                      {formatCurrency(toNum(customer.balance))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {toNum(customer.balance) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {t("common.active")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant">{t("common.none")}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="material-symbols-outlined text-sm text-outline opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
}

function SummaryCard({ label, value, count, accent, color }: { label: string; value: string; count: number; accent: string; color: string }) {
  const { t } = useTranslation();
  return (
    <div className={`bg-surface-container-low rounded-xl border border-outline-variant p-card-padding border-r-2 ${accent}`}>
      <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest">{label}</p>
      <p className={`font-headline-sm text-headline-sm mt-2 ${color}`}>{value}</p>
      <p className="text-[10px] text-on-surface-variant mt-1.5 font-body-md">{count} {t("common.items")}</p>
    </div>
  );
}

function ModalShell({ title, icon, children, onClose }: { title: string; icon?: string; children: React.ReactNode; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">{icon ?? "payments"}</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.amount")}</label>
      <input type="number" step="0.01" min="0.01" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary text-headline-sm font-data-table text-center transition-colors" placeholder="0.00" />
    </div>
  );
}

function NotesInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.notes")} ({t("common.optional")})</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 outline-none focus:border-primary text-sm resize-none h-20 transition-colors" placeholder={placeholder} />
    </div>
  );
}

function ModalError({ error }: { error: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg border border-error/20">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span>{error}</span>
    </div>
  );
}

function ModalActions({ submitting, label, onCancel, onSubmit }: { submitting: boolean; label: string; onCancel: () => void; onSubmit: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="pt-4 border-t border-outline-variant flex gap-3">
      <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm font-bold">{t("common.cancel")}</button>
      <button onClick={onSubmit} disabled={submitting}
        className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all">
        {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
        {submitting ? t("common.saving") : label}
      </button>
    </div>
  );
}

function PoolDepositModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError("Enter a valid positive amount"); return; }
    setError(""); setSubmitting(true);
    try { await poolApi.deposit({ amount: parsed, notes: notes || undefined }); onDone(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Deposit failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell title={t("storeCredit.depositTitle")} icon="add_circle" onClose={onClose}>
      <AmountInput value={amount} onChange={setAmount} />
      <NotesInput value={notes} onChange={setNotes} placeholder={t("storeCredit.reasonPlaceholder")} />
      {error && <ModalError error={error} />}
      <ModalActions submitting={submitting} label={t("storeCredit.deposit")} onCancel={onClose} onSubmit={handleSubmit} />
    </ModalShell>
  );
}

function PoolWithdrawModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError("Enter a valid positive amount"); return; }
    setError(""); setSubmitting(true);
    try { await poolApi.withdraw({ amount: parsed, notes: notes || undefined }); onDone(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Withdrawal failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell title={t("storeCredit.withdrawTitle")} icon="remove_circle" onClose={onClose}>
      <AmountInput value={amount} onChange={setAmount} />
      <NotesInput value={notes} onChange={setNotes} placeholder={t("storeCredit.reasonPlaceholder")} />
      {error && <ModalError error={error} />}
      <ModalActions submitting={submitting} label={t("storeCredit.withdraw")} onCancel={onClose} onSubmit={handleSubmit} />
    </ModalShell>
  );
}

function useCustomers() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    customersApi.list({ page: 1, size: 200 })
      .then((r) => { if (!cancelled) setCustomers(r.items ?? []); })
      .catch((err: unknown) => { if (!cancelled) setFetchError(err instanceof Error ? err.message : "Failed to load customers"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { customers, loading, fetchError };
}

function CustomerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const { customers, loading, fetchError } = useCustomers();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-on-surface-variant py-2">
        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        {t("common.loading")}
      </div>
    );
  }

  if (fetchError) {
    return <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg border border-error/20">{fetchError}</div>;
  }

  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary text-sm appearance-none cursor-pointer transition-colors">
        <option value="">{customers.length === 0 ? t("customer.noCustomers") : t("customer.select")}</option>
        {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">expand_more</span>
    </div>
  );
}

function PoolIssueModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!customerId) { setError("Select a customer"); return; }
    if (!amount || isNaN(parsed) || parsed <= 0) { setError("Enter a valid positive amount"); return; }
    setError(""); setSubmitting(true);
    try { await poolApi.issueToCustomer({ customer_id: customerId, amount: parsed, notes: notes || undefined }); onDone(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to issue credit"); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell title={t("storeCredit.issueTitle")} icon="arrow_outward" onClose={onClose}>
      <div>
        <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("customer.title")}</label>
        <CustomerSelect value={customerId} onChange={setCustomerId} />
      </div>
      <AmountInput value={amount} onChange={setAmount} />
      <NotesInput value={notes} onChange={setNotes} placeholder={t("storeCredit.reasonPlaceholder")} />
      {error && <ModalError error={error} />}
      <ModalActions submitting={submitting} label={t("storeCredit.issue")} onCancel={onClose} onSubmit={handleSubmit} />
    </ModalShell>
  );
}

function PoolReturnModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!customerId) { setError("Select a customer"); return; }
    if (!amount || isNaN(parsed) || parsed <= 0) { setError("Enter a valid positive amount"); return; }
    setError(""); setSubmitting(true);
    try { await poolApi.returnFromCustomer({ customer_id: customerId, amount: parsed, notes: notes || undefined }); onDone(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to return credit"); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell title={t("storeCredit.returnTitle")} icon="reply" onClose={onClose}>
      <div>
        <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("customer.title")}</label>
        <CustomerSelect value={customerId} onChange={setCustomerId} />
      </div>
      <AmountInput value={amount} onChange={setAmount} />
      <NotesInput value={notes} onChange={setNotes} placeholder={t("storeCredit.reasonPlaceholder")} />
      {error && <ModalError error={error} />}
      <ModalActions submitting={submitting} label={t("storeCredit.return")} onCancel={onClose} onSubmit={handleSubmit} />
    </ModalShell>
  );
}
