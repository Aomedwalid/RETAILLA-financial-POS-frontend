"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useVendorPurchaseOrders, useCreateVendorReturn } from "@/features/vendors/hooks";
import { productsApi } from "@/features/products/api";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import { billNet, toNum } from "@/features/vendors/types";
import type { BillResponse, PaymentChannel, VendorReturnLineRequest } from "@/features/vendors/types";
import { validateVendorReturn } from "@/features/vendors/validation";
import Toast from "@/components/ui/Toast";

interface VendorReturnModalProps {
  vendorId: string;
  bill: BillResponse;
  onClose: () => void;
}

const CHANNELS: PaymentChannel[] = ["CASH", "INSTAPAY", "VODAFONE_CASH", "OTHER"];

export default function VendorReturnModal({ vendorId, bill, onClose }: VendorReturnModalProps) {
  const { t } = useTranslation();
  const { data: pos } = useVendorPurchaseOrders(vendorId);
  const returnMutation = useCreateVendorReturn();

  const po = pos?.find((p) => p.id === bill.po_id);
  const poLines = po?.lines ?? [];

  // Variant display names for the return row picker.
  const { data: products } = useQuery({
    queryKey: queryKeys.products.list({ size: 500 }),
    queryFn: () => productsApi.list({ size: 500 }),
    enabled: poLines.length > 0,
    staleTime: 60_000,
  });
  const variantName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products?.items ?? []) {
      for (const v of p.variants) map.set(v.id, p.name);
    }
    return map;
  }, [products]);

  const [rows, setRows] = useState<
    { variant_id: string; quantity: number | string; unit_amount: number | string }[]
  >(() =>
    poLines.slice(0, 0).map((l) => ({ variant_id: l.variant_id, quantity: "", unit_amount: l.unit_cost }))
  );
  const [cashRefund, setCashRefund] = useState("");
  const [channel, setChannel] = useState<PaymentChannel>("CASH");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [createdCredit, setCreatedCredit] = useState<{ amount: number; remaining: number } | null>(null);
  const [createdTotal, setCreatedTotal] = useState<number | null>(null);
  const [createdCash, setCreatedCash] = useState<number | null>(null);

  const returnedTotal = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const q = Number(r.quantity) || 0;
        const u = Number(r.unit_amount) || 0;
        return sum + q * u;
      }, 0),
    [rows]
  );

  const netAmount = billNet(bill);
  const maxCredit = Math.max(0, toNum(bill.amount_paid) - Math.max(0, netAmount));

  function addRow() {
    const leftover = poLines.filter(
      (l) => !rows.some((r) => r.variant_id === l.variant_id)
    );
    if (leftover.length === 0) return;
    const l = leftover[0];
    setRows((prev) => [
      ...prev,
      { variant_id: l.variant_id, quantity: "", unit_amount: l.unit_cost },
    ]);
  }

  function updateRow(i: number, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setError("");
    const invalid = validateVendorReturn(rows, cashRefund, returnedTotal, maxCredit, t);
    if (invalid) {
      setError(invalid);
      return;
    }
    const cash = Number(cashRefund) || 0;

    const lines: VendorReturnLineRequest[] = rows.map((r) => ({
      variant_id: r.variant_id,
      quantity: Number(r.quantity),
      unit_amount: Number(r.unit_amount),
    }));

    returnMutation.mutate(
      {
        vendorId,
        billId: bill.id,
        body: {
          lines,
          ...(cash > 0 ? { cash_refund_amount: cash, channel } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      },
      {
        onSuccess: (res) => {
          setCreatedTotal(toNum(res.returned_total));
          setCreatedCash(toNum(res.cash_refunded_amount));
          if (res.credit) {
            setCreatedCredit({ amount: toNum(res.credit.amount), remaining: toNum(res.credit.remaining) });
          } else {
            setCreatedCredit(null);
          }
          setToast({ message: t("vendorReturn.success"), type: "success" });
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : t("vendorReturn.failed");
          setToast({ message: msg, type: "error" });
          setError(msg);
        },
      }
    );
  }

  const submitting = returnMutation.isPending;

  // Success summary screen
  if (createdTotal !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in p-6 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-secondary">assignment_return</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface">{t("vendorReturn.done")}</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {t("vendorReturn.returnedTotal")} {formatCurrency(createdTotal)}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("vendorReturn.returnedTotal")}</span>
              <span className="font-data-table font-bold text-on-surface">{formatCurrency(createdTotal)}</span>
            </div>
            {createdCredit && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("vendorReturn.creditCreated")}</span>
                <span className="font-data-table font-bold text-secondary">{formatCurrency(createdCredit.amount)}</span>
              </div>
            )}
            {createdCash && createdCash > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{t("vendorReturn.cashRefunded")}</span>
                <span className="font-data-table font-bold text-on-surface">{formatCurrency(createdCash)}</span>
              </div>
            )}
          </div>
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
      <div className="relative w-[95vw] md:w-full max-w-lg max-h-[90vh] bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl flex flex-col animate-scale-in">
        <div className="shrink-0 px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("vendorReturn.title")}</h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {bill.bill_reference || `#${bill.id.slice(0, 8)}`}
            </p>
          </div>
          <button onClick={onClose} disabled={submitting} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant disabled:opacity-30">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {poLines.length > 0 ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-container-high border-b border-outline-variant/50 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendorReturn.lines")}</span>
                <button onClick={addRow} className="text-[11px] text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-xs">add</span>
                  {t("vendorReturn.addLine")}
                </button>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {rows.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-outline text-center">{t("vendorReturn.addLineHint")}</p>
                ) : (
                  rows.map((r, i) => (
                    <div key={i} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={r.variant_id}
                          onChange={(e) => updateRow(i, { variant_id: e.target.value })}
                          className="flex-1 h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
                        >
                          <option value="">{t("vendorReturn.selectVariant")}</option>
                          {poLines.map((l) => (
                            <option key={l.variant_id} value={l.variant_id}>
                              {variantName.get(l.variant_id) || l.variant_id.slice(0, 12)}
                            </option>
                          ))}
                        </select>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(i)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error/10 text-outline hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={t("vendorReturn.quantity")}>
                          <input
                            type="number" min="1"
                            value={r.quantity}
                            onChange={(e) => updateRow(i, { quantity: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                          />
                        </Field>
                        <Field label={t("vendorReturn.unitAmount")}>
                          <input
                            type="number" step="0.01" min="0"
                            value={r.unit_amount}
                            onChange={(e) => updateRow(i, { unit_amount: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                          />
                        </Field>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end px-4 py-2.5 border-t border-outline-variant/30 text-sm font-bold font-data-table text-on-surface">
                {t("vendorReturn.returnedTotal")}: {formatCurrency(returnedTotal)}
              </div>
            </div>
          ) : (
            <p className="text-xs text-outline">{t("vendorReturn.noPO")}</p>
          )}

          {/* Cash refund */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendorReturn.cashRefund")}</p>
            <p className="text-[10px] text-outline">{t("vendorReturn.cashHint")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("vendorReturn.cashAmount")}>
                <input
                  type="number" step="0.01" min="0"
                  value={cashRefund}
                  onChange={(e) => setCashRefund(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary font-data-table"
                  placeholder="0.00"
                />
              </Field>
              <Field label={t("vendorReturn.channel")}>
                <select value={channel} onChange={(e) => setChannel(e.target.value as PaymentChannel)} className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary">
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{t(`vendorReturn.channel.${c}`)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="text-[10px] text-outline font-data-table">
              {t("vendorReturn.refundableCredit")}: {formatCurrency(maxCredit)} — {t("vendorReturn.refundableNote")}
            </p>
          </div>

          <Field label={t("common.notes")}>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-sm text-on-surface outline-none focus:border-primary"
              placeholder={t("vendorReturn.notesPlaceholder")}
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-sm text-error">
              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rows.length === 0}
            className="px-5 py-2 rounded-lg bg-error text-on-error text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                {t("vendorReturn.submitting")}
              </>
            ) : (
              t("vendorReturn.submit")
            )}
          </button>
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