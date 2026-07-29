"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import { budgetsApi } from "@/features/budgets/api";
import type { BudgetStatusItem, ExpenseCategory } from "@/features/budgets/types";
import { formatDate, currentMonthStart, cls } from "@/features/budgets/types";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { DynamicCreateBudgetModal, DynamicDeactivateBudgetDialog } from "@/lib/lazy-modals";

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

function StatusBadge({ item }: { item: BudgetStatusItem }) {
  const { t } = useTranslation();
  if (item.monthly_limit === 0 && item.actual_spent > 0) {
    return (
      <span className="text-[10px] font-bold text-on-surface-variant bg-outline/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">warning</span>
        {t("budget.notStarted")}
      </span>
    );
  }
  if (item.monthly_limit === 0 && item.actual_spent === 0) {
    return (
      <span className="text-[10px] font-bold text-on-surface-variant px-2 py-0.5 rounded inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">remove_circle_outline</span>
        {t("budget.notStarted")}
      </span>
    );
  }
  if (item.exceeded) {
    return (
      <span className="text-[10px] font-bold text-error bg-error-container/15 px-2 py-0.5 rounded inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">error</span>
        {t("budget.overspent")}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
      <span className="material-symbols-outlined text-[12px]">check_circle</span>
      {t("budget.onTrack")}
    </span>
  );
}

function BudgetStatusRow({ item }: { item: BudgetStatusItem }) {
  const limit = item.monthly_limit;
  const isNoBudget = limit === 0;
  const pct = limit > 0 ? Math.min(100, (item.actual_spent / limit) * 100) : 0;
  const remainingColor = item.remaining < 0 ? "text-error" : item.remaining === 0 ? "text-on-surface-variant" : "text-secondary";

  return (
    <tr className="hover:bg-surface-container-high transition-colors">
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-on-surface">{item.category}</span>
      </td>
      <td className="px-6 py-4 text-right font-data-table tabular-nums">
        {isNoBudget ? <span className="text-on-surface-variant/50">&mdash;</span> : formatCurrency(limit)}
      </td>
      <td className="px-6 py-4 text-right font-data-table tabular-nums">
        {formatCurrency(item.actual_spent)}
      </td>
      <td className={`px-6 py-4 text-right font-data-table tabular-nums font-bold ${remainingColor}`}>
        {item.remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(item.remaining))}
      </td>
      <td className="px-6 py-4 text-center">
        <StatusBadge item={item} />
      </td>
      <td className="px-6 py-4">
        {!isNoBudget && (
          <div className="flex items-center gap-2 w-full max-w-[120px] ml-auto">
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={cls(
                  "h-full rounded-full",
                  item.exceeded ? "bg-error" : pct > 80 ? "bg-tertiary" : "bg-secondary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cls(
              "text-[10px] font-bold tabular-nums",
              item.exceeded ? "text-error" : "text-on-surface-variant"
            )}>
              {pct.toFixed(0)}%
            </span>
          </div>
        )}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded bg-surface-container-highest/60 animate-pulse" style={{ width: `${40 + i * 15}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function BudgetsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [monthStart, setMonthStart] = useState(currentMonthStart);
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear());
  const [budgetMonth, setBudgetMonth] = useState(new Date().getMonth());
  const [modalState, setModalState] = useState<"none" | "create" | "edit">("none");
  const [editCategory, setEditCategory] = useState<ExpenseCategory | undefined>();
  const [editLimit, setEditLimit] = useState<number | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; category: string } | null>(null);

  const statusQ = useQuery({
    queryKey: ["budgetStatus", monthStart],
    queryFn: () => budgetsApi.status(monthStart),
    enabled: !!accessToken,
  });
  const budgetsQ = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list(),
    enabled: !!accessToken,
  });

  const statusData: BudgetStatusItem[] = Array.isArray(statusQ.data) ? statusQ.data : [];
  const budgetsData = Array.isArray(budgetsQ.data) ? budgetsQ.data : [];

  const loading = statusQ.isLoading || budgetsQ.isLoading;
  const error = statusQ.error || budgetsQ.error;

  const triggerRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["budgetStatus"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }, [queryClient]);

  function navigateMonth(delta: number) {
    let m = budgetMonth + delta;
    let y = budgetYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setBudgetMonth(m);
    setBudgetYear(y);
    setMonthStart(`${y}-${String(m + 1).padStart(2, "0")}-01`);
  }

  function openEdit(b: { category: string; monthly_limit: string }) {
    setEditCategory(b.category as ExpenseCategory);
    setEditLimit(parseFloat(b.monthly_limit));
    setModalState("edit");
  }

  function closeModal() {
    setModalState("none");
    setEditCategory(undefined);
    setEditLimit(undefined);
  }

  function handleModalSuccess() {
    closeModal();
    triggerRefresh();
  }

  function handleDeactivateSuccess() {
    setDeactivateTarget(null);
    triggerRefresh();
  }

  const currentLabel = getMonthLabel(budgetYear, budgetMonth);
  const exceededCount = statusData.filter((b) => b.exceeded && b.monthly_limit > 0).length;
  const unbudgetedCount = statusData.filter((b) => b.monthly_limit === 0 && b.actual_spent > 0).length;

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-headline-md font-bold text-on-surface">{t("budget.title")}</h1>
          <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => navigateMonth(-1)}
              className="px-2 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-[11px] font-bold text-primary min-w-[120px] text-center whitespace-nowrap">
              {currentLabel}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="px-2 py-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => setModalState("create")}
          className="bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t("budget.new")}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-error-container/15 border border-error/20 rounded-lg px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">error_outline</span>
          <div className="flex-1">
            <p className="text-xs text-error font-bold">{t("common.failedToLoad")}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {error instanceof Error ? error.message : t("common.unknownError")}
              {error instanceof TypeError && (
                <span className="block mt-1 text-on-surface-variant/60">
                  {t("common.somethingWentWrong")} <span className="font-mono">http://localhost:8000</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => triggerRefresh()}
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* Budget Status Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden flex flex-col mb-gutter">
        <div className="p-card-padding border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t("budget.budgetStatus")}</p>
          <div className="flex items-center gap-3">
            {exceededCount > 0 && (
              <span className="text-[10px] bg-error-container/15 text-error px-2 py-0.5 rounded font-bold">
                {exceededCount} {t("budget.overspent")}
              </span>
            )}
            {unbudgetedCount > 0 && (
              <span className="text-[10px] bg-outline/10 text-on-surface-variant px-2 py-0.5 rounded font-bold">
                {unbudgetedCount} {t("budget.remaining")}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <table className="w-full text-left">
            <thead>
              <tr className="text-label-caps text-on-surface-variant uppercase border-b border-outline-variant">
                {[t("common.category"), t("budget.monthlyLimit"), t("budget.spent"), t("budget.remaining"), t("common.status"), t("budget.usage")].map((h) => (
                  <th key={h} className="px-6 py-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : statusData.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant/30 mb-3">account_balance_wallet</span>
            <p className="text-sm text-on-surface-variant font-medium">{t("budget.noBudgets")}</p>
            <p className="text-[11px] text-on-surface-variant/60 mt-1">{t("budget.create")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr className="text-label-caps text-on-surface-variant uppercase border-b border-outline-variant">
                  <th className="px-6 py-4 font-semibold">{t("common.category")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("budget.monthlyLimit")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("budget.spent")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("budget.remaining")}</th>
                  <th className="px-6 py-4 font-semibold text-center">{t("common.status")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("budget.usage")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {statusData.map((item) => (
                  <BudgetStatusRow key={item.category} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget Management Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden flex flex-col">
        <div className="p-card-padding border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t("budget.budgetManagement")}</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{t("budget.notes")}</p>
          </div>
          <button
            onClick={() => setModalState("create")}
            className="bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t("budget.new")}
          </button>
        </div>

        <div className="border-b border-outline-variant bg-surface-container-high/50 px-card-padding py-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {t("budget.deactivateNote")}
          </p>
        </div>

        {budgetsData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant/30 mb-3">account_balance_wallet</span>
            <p className="text-sm text-on-surface-variant font-medium">{t("budget.noBudgets")}</p>
            <p className="text-[11px] text-on-surface-variant/60 mt-1">{t("budget.create")}</p>
          </div>
        ) : loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-container-highest/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr className="text-label-caps text-on-surface-variant uppercase border-b border-outline-variant">
                  <th className="px-6 py-4 font-semibold">{t("common.category")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("budget.monthlyLimit")}</th>
                  <th className="px-6 py-4 font-semibold text-center">{t("common.status")}</th>
                  <th className="px-6 py-4 font-semibold">{t("common.date")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {budgetsData.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-on-surface">{b.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-data-table tabular-nums">
                      {formatCurrency(b.monthly_limit)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        <span className="text-xs font-bold text-on-surface">{t("common.active")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => setDeactivateTarget({ id: b.id, category: b.category })}
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error-container/15 transition-colors"
                        >
                          {t("budget.deactivate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-card-padding py-3 border-t border-outline-variant flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">
            {budgetsData.length} {t("common.active")} {t("budget.title")}
          </span>
        </div>
      </div>

      {/* Modals */}
      <DynamicCreateBudgetModal
        open={modalState === "create"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />
      <DynamicCreateBudgetModal
        open={modalState === "edit"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        editCategory={editCategory}
        editLimit={editLimit}
      />
      <DynamicDeactivateBudgetDialog
        open={deactivateTarget !== null}
        category={deactivateTarget?.category ?? ""}
        budgetId={deactivateTarget?.id ?? ""}
        onClose={() => setDeactivateTarget(null)}
        onSuccess={handleDeactivateSuccess}
      />
    </div>
  );
}
