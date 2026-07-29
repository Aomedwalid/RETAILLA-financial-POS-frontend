"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { customersApi } from "../api";
import type { CustomerListItem } from "../types";

interface DeleteCustomerDialogProps {
  customer: CustomerListItem;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteCustomerDialog({ customer, onClose, onDeleted }: DeleteCustomerDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setSubmitting(true);
    try {
      await customersApi.delete(customer.id);
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.failedToLoad"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div
        className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-error">delete_forever</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("customer.delete")}</h3>
          <p className="text-on-surface-variant text-sm">
            {t("customer.deleteConfirm")} <span className="font-bold text-on-surface">{customer.name}</span>?
          </p>
          <p className="text-xs text-on-surface-variant -mt-3">{t("common.thisActionCannotBeUndone")}</p>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg text-right">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-error text-on-error font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {submitting ? t("common.saving") : t("common.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
