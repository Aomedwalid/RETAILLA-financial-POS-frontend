"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLedgerImport } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";
import { toNum } from "@/features/vendors/types";
import type { LedgerImportRequest, LedgerPaymentRecord, LedgerImportPayment } from "@/features/vendors/types";
import { validateLedgerImport } from "@/features/vendors/validation";
import Toast from "@/components/ui/Toast";

interface LedgerImportModalProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

let _id = 0;
function uid() { return `led_${++_id}`; }

type LedgerRow = Omit<LedgerPaymentRecord, "payments"> & { _key: string; payments: PaymentRow[] };
type PaymentRow = LedgerImportPayment & { _key: string };

function emptyPayment(): PaymentRow {
  return { _key: uid(), amount: 0, payment_date: new Date().toISOString().slice(0, 10), channel_note: "" };
}

function emptyRecord(): LedgerRow {
  return { _key: uid(), invoice_ref: "", invoice_amount: 0, return_amount: 0, payments: [emptyPayment()] };
}

export default function LedgerImportModal({ vendorId, vendorName, onClose }: LedgerImportModalProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<LedgerRow[]>([emptyRecord()]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [done, setDone] = useState<{ submitted: LedgerImportRequest; accepted: boolean } | null>(null);
  const importMutation = useLedgerImport();

  function addRecord() {
    setRecords((prev) => [...prev, emptyRecord()]);
  }
  function removeRecord(key: string) {
    setRecords((prev) => (prev.length === 1 ? prev : prev.filter((r) => r._key !== key)));
  }
  function updateRecord(key: string, patch: Partial<Omit<LedgerRow, "payments" | "_key">>) {
    setRecords((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  }
  function addPayment(recordKey: string) {
    setRecords((prev) => prev.map((r) => (r._key === recordKey ? { ...r, payments: [...r.payments, emptyPayment()] } : r)));
  }
  function removePayment(recordKey: string, payKey: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r._key === recordKey ? { ...r, payments: r.payments.filter((p) => p._key !== payKey) } : r
      )
    );
  }
  function updatePayment(recordKey: string, payKey: string, patch: Partial<PaymentRow>) {
    setRecords((prev) =>
      prev.map((r) =>
        r._key === recordKey
          ? { ...r, payments: r.payments.map((p) => (p._key === payKey ? { ...p, ...patch } : p)) }
          : r
      )
    );
  }

  const totalInvoice = records.reduce((s, r) => s + (toNum(r.invoice_amount) || 0), 0);
  const totalPayments = records.reduce(
    (s, r) => s + r.payments.reduce((p, pay) => p + (toNum(pay.amount) || 0), 0),
    0
  );

  function buildPayload(): LedgerImportRequest {
    return {
      records: records.map(({ _key, ...r }) => ({
        invoice_ref: r.invoice_ref.trim(),
        invoice_amount: toNum(r.invoice_amount),
        return_amount: toNum(r.return_amount),
        payments: r.payments.map(({ _key: _pk, ...p }) => ({
          amount: toNum(p.amount),
          payment_date: p.payment_date,
          ...(p.channel_note?.trim() ? { channel_note: p.channel_note.trim() } : {}),
        })),
      })),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
  }

  function handleSubmit() {
    setError("");
    const payload = buildPayload();
    const invalid = validateLedgerImport(payload.records, t);
    if (invalid) { setError(invalid); return; }

    importMutation.mutate(
      { vendorId, body: payload },
      {
        onSuccess: () => {
          setDone({ submitted: payload, accepted: true });
        },
        onError: (err) => {
          // Endpoint is not live yet; surface the message + "awaiting backend" note.
          const msg = err instanceof Error ? err.message : t("ledgerImport.failed");
          setError(msg);
          setDone({ submitted: payload, accepted: false });
        },
      }
    );
  }

  const submitting = importMutation.isPending;

  if (done) {
    const net = done.submitted.records.reduce((s, r) => s + r.invoice_amount - r.return_amount, 0);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in p-6 space-y-5 text-center">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${done.accepted ? "bg-secondary/20" : "bg-[#d99c00]/15"}`}>
              <span className={`material-symbols-outlined text-[36px] ${done.accepted ? "text-secondary" : "text-[#d99c00]"}`}>
                {done.accepted ? "check_circle" : "hourglass_top"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface">
              {done.accepted ? t("ledgerImport.done") : t("ledgerImport.pendingTitle")}
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              {done.accepted ? t("ledgerImport.submitted") : t("ledgerImport.awaitingBackend")}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("ledgerImport.records")}</span>
              <span className="font-data-table font-bold text-on-surface">{done.submitted.records.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("ledgerImport.invoiceTotal")}</span>
              <span className="font-data-table font-bold text-on-surface">{formatCurrency(totalInvoice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("ledgerImport.netTotal")}</span>
              <span className="font-data-table font-bold text-on-surface">{formatCurrency(net)}</span>
            </div>
          </div>
          {!done.accepted && (
            <p className="text-[11px] text-[#d99c00] bg-[#d99c00]/10 border border-[#d99c00]/20 rounded-lg px-3 py-2">
              {t("ledgerImport.awaitingBackendNote")}
            </p>
          )}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold">
            {t("common.done")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-2xl max-h-[90vh] bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl flex flex-col animate-scale-in">
        <div className="shrink-0 px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("ledgerImport.title")}</h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{vendorName}</p>
          </div>
          <button onClick={onClose} disabled={submitting} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant disabled:opacity-30">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#d99c00]/10 text-sm text-[#d99c00] border border-[#d99c00]/20">
            <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
            <span>{t("ledgerImport.awaitingBackendNote")}</span>
          </div>

          {records.map((record) => (
            <div key={record._key} className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-container-high border-b border-outline-variant/50 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("ledgerImport.record")}</span>
                {records.length > 1 && (
                  <button onClick={() => removeRecord(record._key)} className="text-[10px] text-error hover:bg-error/10 px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">delete</span>
                    {t("ledgerImport.removeRecord")}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={t("ledgerImport.invoiceRef")}>
                    <input value={record.invoice_ref} onChange={(e) => updateRecord(record._key, { invoice_ref: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary" placeholder={t("ledgerImport.invoiceRefPlaceholder")} />
                  </Field>
                  <Field label={t("ledgerImport.invoiceAmount")}>
                    <input type="number" step="0.01" min="0" value={record.invoice_amount} onChange={(e) => updateRecord(record._key, { invoice_amount: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table" />
                  </Field>
                  <Field label={t("ledgerImport.returnAmount")}>
                    <input type="number" step="0.01" min="0" value={record.return_amount} onChange={(e) => updateRecord(record._key, { return_amount: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table" />
                  </Field>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("ledgerImport.payments")}</span>
                    <button onClick={() => addPayment(record._key)} className="text-[11px] text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-xs">add</span>
                      {t("ledgerImport.addPayment")}
                    </button>
                  </div>
                  {record.payments.map((pay) => (
                    <div key={pay._key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                      <Field label={t("ledgerImport.paymentAmount")}>
                        <input type="number" step="0.01" min="0" value={pay.amount} onChange={(e) => updatePayment(record._key, pay._key, { amount: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table" />
                      </Field>
                      <Field label={t("ledgerImport.paymentDate")}>
                        <input type="date" value={pay.payment_date} onChange={(e) => updatePayment(record._key, pay._key, { payment_date: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary" />
                      </Field>
                      <Field label={t("ledgerImport.channelNote")}>
                        <input value={pay.channel_note} onChange={(e) => updatePayment(record._key, pay._key, { channel_note: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary" placeholder={t("ledgerImport.channelNotePlaceholder")} />
                      </Field>
                      {record.payments.length > 1 && (
                        <button onClick={() => removePayment(record._key, pay._key)} className="w-8 h-9 flex items-center justify-center rounded-lg hover:bg-error/10 text-outline hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addRecord}
            className="w-full py-3 rounded-xl border-2 border-dashed border-outline/30 text-sm text-outline hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t("ledgerImport.addRecord")}
          </button>

          <Field label={t("common.notes")}>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary" placeholder={t("ledgerImport.notesPlaceholder")} />
          </Field>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-sm text-error">
              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-outline-variant flex items-center justify-between gap-3">
          <p className="text-xs text-on-surface-variant font-data-table">
            {records.length} {t("ledgerImport.records")} &middot; {formatCurrency(totalInvoice)} {t("ledgerImport.invoiceTotal")} &middot; {formatCurrency(totalPayments)} {t("ledgerImport.paymentsTotal")}
          </p>
          <div className="flex gap-3 shrink-0">
            <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">{t("common.cancel")}</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {submitting ? t("common.saving") : t("ledgerImport.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1 block">{label}</label>
      {children}
    </div>
  );
}