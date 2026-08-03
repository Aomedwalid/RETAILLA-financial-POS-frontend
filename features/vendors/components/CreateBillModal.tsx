"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateBill } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";

interface CreateBillModalProps {
  vendorId: string;
  poId: string;
  poTotal: number;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateBillModal({ vendorId, poId, poTotal, onClose, onCreated }: CreateBillModalProps) {
  const { t } = useTranslation();
  const [billReference, setBillReference] = useState("");
  const [amount, setAmount] = useState(String(poTotal));
  const [returnAmount, setReturnAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const createBillMutation = useCreateBill();

  const amt = parseFloat(amount);
  const ret = parseFloat(returnAmount) || 0;
  const net = (isNaN(amt) ? 0 : amt) - ret;

  function handleSubmit() {
    if (!amt || amt <= 0) { setError(t("validation.amountPositive")); return; }
    if (ret < 0 || ret > amt) { setError(t("vendor.bill.returnExceeds")); return; }
    setError("");
    const body: { bill_reference?: string; amount: number; return_amount?: number; due_date?: string; notes?: string } = { amount: amt };
    if (billReference.trim()) body.bill_reference = billReference.trim();
    if (ret > 0) body.return_amount = ret;
    if (dueDate) body.due_date = new Date(dueDate).toISOString();
    if (notes.trim()) body.notes = notes.trim();
    createBillMutation.mutate(
      { vendorId, poId, body },
      {
        onSuccess: () => {
          onCreated();
          onClose();
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("vendor.bill.failedToCreate"));
        },
      }
    );
  }

  const submitting = createBillMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("vendor.createBill")}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">PO #{poId.slice(0, 8)}</span>
            <span className="font-data-table text-on-surface font-semibold">{formatCurrency(poTotal)}</span>
          </div>
          <Field label={t("vendor.billReference")}>
            <input value={billReference} onChange={(e) => setBillReference(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder={t("vendor.billRefPlaceholder")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("common.amount")} *`}>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary font-data-table" />
            </Field>
            <Field label={t("vendor.bill.returnAmount")}>
              <input type="number" step="0.01" min="0" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary font-data-table" placeholder="0.00" />
            </Field>
          </div>
          {net > 0 && (
            <p className="text-[11px] text-outline font-data-table">
              {t("vendor.bill.netAmount")}: {formatCurrency(net)}
            </p>
          )}
          <Field label={t("vendor.dueDate")}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" />
          </Field>
          <Field label={t("common.notes")}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary resize-none" placeholder={t("common.notes")} />
          </Field>
          {error && <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">{t("common.cancel")}</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("vendor.createBill")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1 block">{label}</label>
      {children}
    </div>
  );
}