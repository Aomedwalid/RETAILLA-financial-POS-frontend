"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { PricingResult, Customer } from "../types";
import CustomerSelector from "./CustomerSelector";

interface PaymentDialogProps {
  pricing: PricingResult;
  onConfirm: (data: { payment_method: string; payment_amount: number; customer_id?: string }) => Promise<void>;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { key: "CASH", labelKey: "pos.cash" },
  { key: "CARD", labelKey: "paymentMethod.card" },
  { key: "MOBILE", labelKey: "paymentMethod.digital" },
  { key: "OTHER", labelKey: "pos.other" },
];

export default function PaymentDialog({ pricing, onConfirm, onClose }: PaymentDialogProps) {
  const { t } = useTranslation();
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState(parseFloat(pricing.grand_total).toFixed(2));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = parseFloat(pricing.grand_total);
  const paid = parseFloat(amount) || 0;
  const change = paid - total;

  async function handleSubmit() {
    if (paid < total) { setError(t("pos.pricing.totalDue")); return; }
    setError(""); setSubmitting(true);
    try {
      await onConfirm({
        payment_method: method,
        payment_amount: paid,
        ...(customer ? { customer_id: customer.id } : {}),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("pos.checkoutError"));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("pos.cash")}</h3>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 text-center">
            <p className="text-label-caps font-label-caps text-outline mb-1">{t("pos.pricing.totalDue")}</p>
            <p className="font-headline-md text-headline-md text-primary">{formatCurrency(total)}</p>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-2 block">{t("pos.paymentMethod")}</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    method === m.key
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("common.amount")}</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">{t("pos.currencySymbol")}</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pr-8 pl-3 text-headline-sm font-data-table text-center outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <CustomerSelector selected={customer} onSelect={setCustomer} />

          {change > 0 && (
            <div className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-secondary font-semibold">{t("pos.change")}</span>
              <span className="font-data-table text-headline-sm text-secondary">{formatCurrency(change)}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex gap-3">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("pos.checkout")}
          </button>
        </div>
      </div>
    </div>
  );
}
