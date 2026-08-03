"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePayBill } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";
import { billNet, toNum } from "@/features/vendors/types";
import type { BillResponse, PaymentMethod, PaymentChannel } from "@/features/vendors/types";
import Toast from "@/components/ui/Toast";

interface PayBillModalProps {
  vendorId: string;
  bill: BillResponse;
  onDone: () => void;
}

const METHODS: PaymentMethod[] = ["CASH", "DIGITAL", "STORE_CREDIT"];
const CHANNELS: PaymentChannel[] = ["CASH", "INSTAPAY", "VODAFONE_CASH", "OTHER"];

export default function PayBillModal({ vendorId, bill, onDone }: PayBillModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const payMutation = usePayBill();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("DIGITAL");
  const [channel, setChannel] = useState<PaymentChannel>("CASH");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const remVal = Math.max(0, billNet(bill) - toNum(bill.amount_paid));

  function openModal() {
    setOpen(true);
    setAmount(String(remVal > 0 ? remVal : ""));
    setMethod("DIGITAL");
    setChannel("CASH");
    setNotes("");
    setError("");
  }

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError(t("validation.amountPositive")); return; }
    if (amt > remVal) { setError(`${t("vendor.pay.exceedsBalance")} ${formatCurrency(remVal)}`); return; }
    setError("");
    const body = {
      amount: amt,
      payment_method: method,
      ...(method === "CASH" || method === "DIGITAL" ? { channel } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    payMutation.mutate(
      { vendorId, billId: bill.id, body },
      {
        onSuccess: () => {
          setToast({ message: t("vendor.pay.success"), type: "success" });
          setOpen(false);
          onDone();
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : t("vendor.pay.failed");
          setError(msg);
          setToast({ message: msg, type: "error" });
        },
      }
    );
  }

  const submitting = payMutation.isPending;

  return (
    <>
      <button onClick={openModal} className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 transition-all">
        {t("vendor.pay")} {formatCurrency(remVal)}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("vendor.payBill")}</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-on-surface-variant">{bill.bill_reference || `#${bill.id.slice(0, 8)}`}</span>
                  <p className="text-[10px] text-outline mt-0.5">{formatCurrency(remVal)} {t("vendor.remaining")}</p>
                </div>
                <span className="font-data-table text-on-surface">{formatCurrency(billNet(bill))}</span>
              </div>
              <Field label={t("vendor.pay.paymentAmount")}>
                <input type="number" step="0.01" min="0.01" max={remVal} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary font-data-table" />
              </Field>
              <Field label={t("vendor.pay.paymentMethod")}>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary">
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{t(`paymentMethod.${m}`)}</option>
                  ))}
                </select>
              </Field>
              {(method === "CASH" || method === "DIGITAL") && (
                <Field label={t("vendor.pay.channel")}>
                  <select value={channel} onChange={(e) => setChannel(e.target.value as PaymentChannel)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary">
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>{t(`vendorReturn.channel.${c}`)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label={t("common.notes")}>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder={t("vendor.pay.notesPlaceholder")} />
              </Field>
              {error && <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
              <button onClick={() => setOpen(false)} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-lg bg-error text-on-error text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                {t("vendor.pay")} {formatCurrency(parseFloat(amount) || 0)}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
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