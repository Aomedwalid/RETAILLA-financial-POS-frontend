"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { budgetsApi } from "@/features/budgets/api";
import type { ExpenseCategory, BudgetCreateRequest } from "@/features/budgets/types";
import { EXPENSE_CATEGORIES } from "@/features/budgets/types";

interface CreateBudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCategory?: ExpenseCategory;
  editLimit?: number;
}

export default function CreateBudgetModal({
  open,
  onClose,
  onSuccess,
  editCategory,
  editLimit,
}: CreateBudgetModalProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<ExpenseCategory>(editCategory ?? "RENT");
  const [monthlyLimit, setMonthlyLimit] = useState(editLimit ?? 0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (monthlyLimit <= 0) {
      setError(t("validation.monthlyLimitPositive"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: BudgetCreateRequest = { category, monthly_limit: monthlyLimit };
      if (notes.trim()) body.notes = notes.trim();
      await budgetsApi.create(body);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.somethingWentWrong");
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-container-low border border-outline-variant rounded-xl w-[95vw] md:w-full max-w-md mx-4 animate-scale-in max-h-[90vh] overflow-y-auto p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-on-surface">{editCategory ? t("budget.editBudget") : t("budget.createBudget")}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-error-container/15 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {editCategory && (
          <div className="mb-4 bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">info</span>
            <p className="text-xs text-tertiary">
              {t("budget.editNote", { category: editCategory })}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
              {t("budget.categoryLabel")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              disabled={!!editCategory}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
              {t("budget.monthlyLimitLabel")}
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-bold">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={monthlyLimit || ""}
                onChange={(e) => setMonthlyLimit(parseFloat(e.target.value) || 0)}
                placeholder={t("common.amount")}
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg pr-7 pl-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
              {t("budget.notesLabel")} <span className="font-normal text-on-surface-variant/60">{t("common.optional")}</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("budget.notesLabel")}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {editCategory ? t("budget.saveChanges") : t("budget.createBudget")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
