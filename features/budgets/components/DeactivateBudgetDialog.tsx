"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { budgetsApi } from "@/features/budgets/api";

interface DeactivateBudgetDialogProps {
  open: boolean;
  category: string;
  budgetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeactivateBudgetDialog({
  open,
  category,
  budgetId,
  onClose,
  onSuccess,
}: DeactivateBudgetDialogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleDeactivate() {
    setSaving(true);
    setError(null);
    try {
      await budgetsApi.deactivate(budgetId);
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
        className="bg-surface-container-low border border-outline-variant rounded-xl w-[95vw] md:w-full max-w-sm mx-4 animate-scale-in max-h-[90vh] overflow-y-auto p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-error-container/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-lg">warning</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">{t("budget.deactivateBudget")}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{category}</p>
          </div>
        </div>

        <p className="text-sm text-on-surface mb-6 leading-relaxed">
          {t("budget.deactivateConfirm")}
        </p>

        {error && (
          <div className="mb-4 bg-error-container/15 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={saving}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-error text-on-error hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
{t("budget.deactivateBudget")}
          </button>
        </div>
      </div>
    </div>
  );
}
