"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { customersApi } from "../api";
import { validateDebtAmount } from "../validation";
import type { CustomerListItem } from "../types";

interface DebtDialogProps {
  customer: CustomerListItem;
  onClose: () => void;
  onAdjusted: () => void;
}

export default function DebtDialog({ customer, onClose, onAdjusted }: DebtDialogProps) {
  const { t } = useTranslation();
  const [operation, setOperation] = useState<"ADD" | "SUBTRACT">("ADD");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const err = validateDebtAmount(amount);
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      await customersApi.adjustDebt(customer.id, {
        operation,
        amount: parseFloat(amount),
      });
      onAdjusted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("customer.failedToAdjustDebt"));
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
        <div className="p-6 border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("customer.debt")}</h3>
          <p className="text-[12px] text-outline mt-1">{t("customer.name")}: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
            <span className="text-on-surface-variant">{t("customer.currentDebt")}</span>
            <span className="font-data-table text-headline-sm text-error">
              {formatCurrency(customer.current_debt)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOperation("ADD")}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                operation === "ADD"
                  ? "border-error bg-error/10 text-error"
                  : "border-outline-variant hover:border-error hover:text-error"
              }`}
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-[10px] font-bold">{t("customer.debt.increase")}</span>
            </button>
            <button
              onClick={() => setOperation("SUBTRACT")}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                operation === "SUBTRACT"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-outline-variant hover:border-secondary hover:text-secondary"
              }`}
            >
              <span className="material-symbols-outlined">remove_circle</span>
              <span className="text-[10px] font-bold">{t("customer.debt.recordPayment")}</span>
            </button>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("common.amount")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 outline-none focus:ring-1 focus:ring-primary text-headline-sm font-data-table text-center"
              placeholder={t("common.amount")}
            />
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant space-y-2">
            <p className="text-xs text-on-surface-variant">
              {operation === "ADD"
                ? t("customer.debt.increaseDescription")
                : t("customer.debt.paymentDescription")}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-6 bg-surface-container-high/80 border-t border-outline-variant flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
