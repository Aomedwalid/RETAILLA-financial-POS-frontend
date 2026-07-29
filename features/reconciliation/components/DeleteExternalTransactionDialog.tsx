"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { reconciliationApi } from "@/lib/api";
import type { ExternalTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface DeleteExternalTransactionDialogProps {
  transaction: ExternalTransaction;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteExternalTransactionDialog({
  transaction,
  onClose,
  onDeleted,
}: DeleteExternalTransactionDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setSubmitting(true);
    try {
      await reconciliationApi.deleteExternalTransaction(transaction.id);
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("reconciliation.failedToDelete"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div
        className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-error">delete_forever</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("reconciliation.deleteTransaction")}</h3>
          <p className="text-on-surface-variant text-sm">
            {t("reconciliation.deleteConfirm")}{" "}
            <span className="font-bold text-on-surface">{transaction.source}</span> {t("reconciliation.deleteWarning")}
          </p>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg text-left">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-error text-on-error font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:brightness-110"
            >
              {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {submitting ? t("reconciliation.deleting") : t("reconciliation.yesDelete")}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
