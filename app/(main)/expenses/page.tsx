"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "@/features/expenses/api";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
  ExpenseResponse,
  ExpenseSummary,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseCategory,
  ExpensePaymentMethod,
  ExpenseCategorySuggestion,
} from "@/features/expenses/types";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  formatDate,
  cls,
  categoryLabel,
  categoryBadgeClass,
} from "@/features/expenses/types";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";
import RecurringTab from "@/features/expenses/components/RecurringTab";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; expense: ExpenseResponse }
  | { type: "delete"; expense: ExpenseResponse };

function SkeletonCard() {
  return (
    <div className="bg-surface-container border border-outline-variant p-card-padding rounded-xl animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded bg-surface-container-highest/60" />
        <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
        <div className="h-1 w-full rounded-full bg-surface-container-highest/40" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
        </td>
      ))}
    </tr>
  );
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const startDateParam = searchParams.get("start_date") ?? "";
  const endDateParam = searchParams.get("end_date") ?? "";

  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"expenses" | "recurring">("expenses");
  const [localStartDate, setLocalStartDate] = useState(startDateParam);
  const [localEndDate, setLocalEndDate] = useState(endDateParam);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalStartDate(startDateParam);
    setLocalEndDate(endDateParam);
  }, [startDateParam, endDateParam]);

  const apiParams: Record<string, string | number | boolean | null | undefined> = { page, size: 10 };
  if (startDateParam) apiParams.start_date = startDateParam;
  if (endDateParam) apiParams.end_date = endDateParam;

  const listQ = useQuery({
    queryKey: ["expenses", page, startDateParam, endDateParam],
    queryFn: () => expensesApi.list(apiParams),
    enabled: !!accessToken,
  });
  const summaryQ = useQuery({
    queryKey: ["expensesSummary", startDateParam, endDateParam],
    queryFn: () => expensesApi.summary(apiParams),
    enabled: !!accessToken,
  });

  const listData = listQ.data;
  const summaryData: ExpenseSummary = summaryQ.data ?? { expenses_count: 0, total_expenses: 0, average_expense: 0, highest_expense: 0 };

  const loading = listQ.isLoading || summaryQ.isLoading;
  const error = listQ.error || summaryQ.error;

  const expenses = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const pages = listData?.pages ?? 0;
  const pageSize = listData?.size ?? 10;

  const triggerRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["expensesSummary"] });
  }, [queryClient]);

  function updateURL(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleDateChange(key: "start_date" | "end_date", value: string) {
    if (key === "start_date") setLocalStartDate(value);
    else setLocalEndDate(value);
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => updateURL(key, value), 400);
  }

  function handleModalSuccess() {
    setModal({ type: "none" });
    triggerRefresh();
  }

  function handleDeleteSuccess() {
    setModal({ type: "none" });
    triggerRefresh();
  }

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-stack-lg bg-surface-container-low p-1 rounded-xl border border-outline-variant w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("expenses")}
          className={cls(
            "px-4 py-2 rounded-lg text-label-caps font-label-caps transition-colors",
            activeTab === "expenses"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {t("expense.allExpenses")}
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={cls(
            "px-4 py-2 rounded-lg text-label-caps font-label-caps transition-colors",
            activeTab === "recurring"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {t("expense.recurringTab")}
        </button>
      </div>

      {activeTab === "expenses" ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-stack-lg">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">{t("expense.title")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t("expense.categoryLabel")}</p>
            </div>
            <button
              onClick={() => setModal({ type: "create" })}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              {t("expense.add")}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-stack-lg bg-error/10 border border-error/20 rounded-lg px-5 py-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-error mt-0.5">error_outline</span>
              <div>
                <p className="font-body-md text-body-md text-error font-semibold">{t("common.failedToLoad")}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{error?.message ?? t("common.unknownError")}</p>
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <div className="bg-surface-container border border-outline-variant p-card-padding rounded-xl transition-all hover:bg-surface-container-high hover:border-primary/20 group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 bg-primary/10 rounded-lg text-primary material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{t("filter.all")}</span>
                  </div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{t("expense.totalExpenses")}</p>
                  <h3 className="font-data-table text-[28px] tabular-nums text-on-surface">{formatCurrency(summaryData.total_expenses)}</h3>
                  <div className="mt-4 h-1 w-full bg-outline-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[70%]" />
                  </div>
                </div>

                <div className="bg-surface-container border border-outline-variant p-card-padding rounded-xl transition-all hover:bg-surface-container-high hover:border-primary/20">
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 bg-secondary/10 rounded-lg text-secondary material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{t("date.custom")}</span>
                  </div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{t("expense.category")}</p>
                  <h3 className="font-data-table text-[28px] tabular-nums text-on-surface">{formatCurrency(summaryData.average_expense)}</h3>
                  <p className="mt-4 text-[12px] text-on-surface-variant">{t("common.showing")} {summaryData.expenses_count} {t("expense.allExpenses")}</p>
                </div>

                <div className="bg-surface-container border border-outline-variant p-card-padding rounded-xl transition-all hover:bg-surface-container-high hover:border-primary/20">
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 bg-error/10 rounded-lg text-error material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    <span className="text-[10px] font-bold text-error uppercase tracking-tighter">{t("expense.titleField")}</span>
                  </div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{t("expense.titleField")}</p>
                  <h3 className="font-data-table text-[28px] tabular-nums text-on-surface">{formatCurrency(summaryData.highest_expense)}</h3>
                  <p className="mt-4 text-[12px] text-on-surface-variant">{t("expense.notes")}</p>
                </div>

                <div className="bg-surface-container border border-outline-variant p-card-padding rounded-xl transition-all hover:bg-surface-container-high hover:border-primary/20">
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 bg-outline/10 rounded-lg text-outline material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{t("common.total")}</span>
                  </div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{t("expense.pendingCount")}</p>
                  <h3 className="font-data-table text-[28px] tabular-nums text-on-surface">{summaryData.expenses_count.toLocaleString("ar-EG")}</h3>
                  <p className="mt-4 text-[12px] text-on-surface-variant">{t("expense.date")}</p>
                </div>
              </>
            )}
          </div>

          {/* Financial Integrity Banner */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-4 rounded-xl mb-stack-lg">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              <strong className="text-primary">{t("expense.notes")}</strong> {t("expense.deleteConfirm")}
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl mb-gutter">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center bg-surface border border-outline-variant rounded-lg w-full md:w-auto flex-wrap">
                <span className="material-symbols-outlined text-on-surface-variant px-3 text-sm">calendar_today</span>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => handleDateChange("start_date", e.target.value)}
                  className="bg-transparent border-none text-on-surface font-body-md focus:ring-0 py-2 px-1 outline-none"
                />
                <span className="text-on-surface-variant px-2">—</span>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => handleDateChange("end_date", e.target.value)}
                  className="bg-transparent border-none text-on-surface font-body-md focus:ring-0 py-2 px-1 outline-none"
                />
              </div>
              {(startDateParam || endDateParam) && (
                <button
                  onClick={() => {
                    setLocalStartDate("");
                    setLocalEndDate("");
                    const p = new URLSearchParams(searchParams.toString());
                    p.delete("start_date");
                    p.delete("end_date");
                    p.delete("page");
                    router.push(`?${p.toString()}`, { scroll: false });
                  }}
                  className="px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-higher transition-colors text-sm"
                >
                  {t("common.close")}
                </button>
              )}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.name")}</th>
                  <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.category")}</th>
                  <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.paymentMethod")}</th>
                  <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.date")}</th>
                  <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.amount")}</th>
                  <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                          <span className="material-symbols-outlined text-3xl text-outline-variant" style={{ fontVariationSettings: "'wght' 200" }}>receipt_long</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.noExpensesFound")}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-2">{t("common.noResults")}</p>
                        <button
                          onClick={() => setModal({ type: "create" })}
                          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all"
                        >
                          <span className="material-symbols-outlined">add</span>
                          {t("expense.createExpense")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-surface-container-highest transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-body-md font-bold text-on-surface">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[12px] text-on-surface-variant mt-0.5 line-clamp-1">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={cls("px-2 py-1 border rounded text-[11px] font-bold", categoryBadgeClass(exp.category))}>
                          {categoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-on-surface-variant font-body-md">
                          <span className="material-symbols-outlined text-[16px]">
                            {exp.payment_method === "CASH" ? "payments" : "credit_card"}
                          </span>
                          {exp.payment_method}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-data-table text-on-surface-variant text-sm">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="py-4 px-6 text-right font-data-table text-on-surface tabular-nums">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ type: "edit", expense: exp })}
                            className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", expense: exp })}
                            className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t("common.showing")} {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} {t("common.of")} {total} {t("common.items")}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-body-md text-body-md text-on-surface-variant">{t("common.page")} {page} {t("common.of")} {pages}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateURL("page", String(Math.max(1, page - 1)))}
                      disabled={page <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      const start = Math.max(1, page - 2);
                      const p = start + i;
                      if (p > pages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => updateURL("page", String(p))}
                          className={cls(
                            "w-8 h-8 flex items-center justify-center rounded transition-colors",
                            p === page
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-surface-variant/20 hover:bg-surface-variant/40"
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => updateURL("page", String(Math.min(pages, page + 1)))}
                      disabled={page >= pages}
                      className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modals */}
          {modal.type === "create" && (
            <CreateExpenseModal onClose={() => setModal({ type: "none" })} onSuccess={handleModalSuccess} />
          )}
          {modal.type === "edit" && (
            <EditExpenseSlideOver expense={modal.expense} onClose={() => setModal({ type: "none" })} onSuccess={handleModalSuccess} />
          )}
          {modal.type === "delete" && (
            <DeleteExpenseDialog expense={modal.expense} onClose={() => setModal({ type: "none" })} onSuccess={handleDeleteSuccess} />
          )}
        </>
      ) : (
        <RecurringTab />
      )}
    </div>
  );
}

// ─── Create Expense Modal ───

function CreateExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<ExpenseCategorySuggestion[]>([]);

  useEffect(() => {
    if (!title || title.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await expensesApi.suggestCategory(title.trim());
        setSuggestions(Array.isArray(result) ? result : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [title]);

  function handleSuggestionClick(suggested: string) {
    if (EXPENSE_CATEGORIES.includes(suggested as ExpenseCategory)) {
      setCategory(suggested as ExpenseCategory);
    }
    setSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!category) { setError("Please select a category"); return; }
    const amt = parseFloat(amount);
    if (!amount || amt <= 0) { setError("Amount must be greater than 0"); return; }
    setError(""); setSaving(true);
    try {
      const body: ExpenseCreate = {
        title: title.trim(),
        amount: amt,
        payment_method: paymentMethod,
        category,
      };
      if (notes.trim()) body.notes = notes.trim();
      await expensesApi.create(body);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.createExpense")}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.titleField")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
              placeholder={t("expense.titleField")}
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(s.suggested_category)}
                    className="px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold hover:bg-primary/15 transition-colors"
                  >
                    {categoryLabel(s.suggested_category as ExpenseCategory)}
                    <span className="ml-1 opacity-60">({s.confidence_score})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.category")}</label>
              <select
                value={category ?? ""}
                onChange={(e) => setCategory(e.target.value ? (e.target.value as ExpenseCategory) : null)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
              >
                <option value="">{t("productForm.category")}</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.amount")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-md">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-7 pr-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.paymentMethod")}</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cls(
                    "p-3 rounded-lg border transition-all flex items-center justify-center gap-2 font-body-md",
                    paymentMethod === method
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {method === "CASH" ? "payments" : "credit_card"}
                  </span>
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.notes")} <span className="text-outline/60">{t("common.optional")}</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("expense.notes")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {saving ? t("common.saving") : t("expense.createExpense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Expense Slide-over ───

function EditExpenseSlideOver({ expense, onClose, onSuccess }: { expense: ExpenseResponse; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(expense.payment_method);
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: ExpenseUpdate = {};
    let hasChanges = false;

    if (title.trim() !== expense.title) { body.title = title.trim(); hasChanges = true; }
    const amt = parseFloat(amount);
    if (amt !== expense.amount) { body.amount = amt; hasChanges = true; }
    if (paymentMethod !== expense.payment_method) { body.payment_method = paymentMethod; hasChanges = true; }
    if (category !== expense.category) { body.category = category; hasChanges = true; }
    const noteVal = notes.trim() || undefined;
    if (noteVal !== (expense.notes ?? undefined)) { body.notes = noteVal; hasChanges = true; }

    if (!hasChanges) { setError("No changes detected"); return; }
    if (title.trim().length < 1) { setError("Title must be at least 1 character"); return; }
    if (amt <= 0) { setError("Amount must be greater than 0"); return; }

    setError(""); setSaving(true);
    try {
      await expensesApi.update(expense.id, body);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[95vw] max-w-[450px] bg-surface-container-high z-[70] shadow-2xl flex flex-col border-l border-outline-variant animate-slide-in overflow-y-auto">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.editExpense")}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
            <p className="text-sm text-on-surface-variant">
              {t("expense.notes")}
            </p>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.titleField")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{categoryLabel(cat)}</option>
              ))}
            </select>
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.amount")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-md">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-7 pr-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.paymentMethod")}</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cls(
                    "p-3 rounded-lg border transition-all flex items-center justify-center gap-2 font-body-md",
                    paymentMethod === method
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {method === "CASH" ? "payments" : "credit_card"}
                  </span>
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("common.notes")} <span className="text-outline/60">{t("common.optional")}</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Delete Expense Dialog ───

function DeleteExpenseDialog({ expense, onClose, onSuccess }: { expense: ExpenseResponse; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async   function handleDelete() {
    setSaving(true); setError("");
    try {
      await expensesApi.delete(expense.id);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.failedToLoad"));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.deleteConfirm")}</h3>
              <p className="text-sm text-on-surface-variant">{expense.title}</p>
            </div>
          </div>
          <div className="bg-error/5 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">info</span>
            <p className="text-sm text-on-surface-variant">
              The cash ledger entry is <strong className="text-error">NOT reversed or removed</strong>. The historical record stays intact for audit trail purposes.
            </p>
          </div>
          <p className="text-on-surface font-body-md">
            Are you sure you want to delete this expense of {formatCurrency(expense.amount)}?
          </p>
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors font-body-md">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-error text-on-error font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all">
            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
