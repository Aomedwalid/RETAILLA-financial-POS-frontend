"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVendorStatement } from "@/features/vendors/hooks";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { billNet, toNum } from "@/features/vendors/types";
import type { BillResponse } from "@/features/vendors/types";
import ProgressBar from "./ProgressBar";

interface BillDetailPanelProps {
  vendorId: string;
  bill: BillResponse;
  onOpenPay: () => void;
  onOpenReturn: () => void;
}

/** Per-bill reconciliation and related activity (returns + payments from statement). */
export default function BillDetailPanel({ vendorId, bill, onOpenPay, onOpenReturn }: BillDetailPanelProps) {
  const { t } = useTranslation();
  const [expandReturn, setExpandReturn] = useState(false);
  const { data: statement } = useVendorStatement(vendorId);

  const amount = toNum(bill.amount);
  const returnAmount = toNum(bill.return_amount);
  const net = billNet(bill);
  const paid = toNum(bill.amount_paid);
  const remaining = Math.max(0, toNum(bill.amount_remaining));

  const returns = (statement?.events ?? []).filter(
    (e) => e.event_type === "RETURN" && e.entity_id === bill.id
  );
  const payments = (statement?.events ?? []).filter(
    (e) => e.event_type === "PAYMENT" && e.entity_id === bill.id
  );

  return (
    <div className="border-t border-outline-variant/50 bg-surface-container-highest/50 px-4 py-4 space-y-4">
      {/* Amount reconciliation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <AmountCell label={t("vendorBill.invoice")} value={formatCurrency(amount)} />
        <AmountCell label={t("vendorBill.return")} value={formatCurrency(returnAmount)} tone={returnAmount > 0 ? "text-secondary" : undefined} />
        <AmountCell label={t("vendorBill.net")} value={formatCurrency(net)} prominent />
        <AmountCell label={t("vendorBill.paid")} value={formatCurrency(paid)} tone="text-secondary" />
        <AmountCell label={t("vendorBill.remaining")} value={formatCurrency(remaining)} tone={remaining > 0 ? "text-error" : "text-secondary"} />
      </div>

      <div>
        <ProgressBar paid={paid} total={net} status={bill.status} />
      </div>

      {bill.notes && (
        <p className="text-[11px] text-outline">{t("common.notes")}: {bill.notes}</p>
      )}

      {/* Returns on this bill */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/50">
        <button
          onClick={() => setExpandReturn((v) => !v)}
          className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-bold text-outline hover:bg-surface-variant/30"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">assignment_return</span>
            {t("vendorBill.returns")} ({returns.length})
          </span>
          <span className="material-symbols-outlined text-sm">{expandReturn ? "expand_less" : "expand_more"}</span>
        </button>
        {expandReturn && (
          <div className="px-4 py-3 space-y-2 border-t border-outline-variant/30">
            {returns.length === 0 ? (
              <p className="text-xs text-outline">{t("vendorBill.noReturns")}</p>
            ) : (
              returns.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">{formatDateTime(r.created_at)}</span>
                  <span className="font-data-table text-secondary">-{formatCurrency(toNum(r.amount))}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Activity (payments with channel note) */}
      <div className="bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/50">
        <div className="px-4 py-3 border-b border-outline-variant/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendorBill.paymentHistory")}</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {payments.length === 0 ? (
            <p className="text-xs text-outline">{t("vendorBill.noPayments")}</p>
          ) : (
            payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="text-on-surface-variant truncate">
                    {t("vendorBill.payment")} — {p.detail ? t(`paymentMethod.channel.${p.detail}`, { defaultValue: p.detail }) : t("paymentMethod.DIGITAL")}
                  </p>
                  <p className="text-[10px] text-outline">{formatDateTime(p.created_at)}</p>
                </div>
                <span className="font-data-table text-secondary shrink-0">-{formatCurrency(toNum(p.amount))}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {bill.status !== "PAID" && (
          <button
            onClick={onOpenPay}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 transition-colors"
          >
            {t("vendor.pay")} {formatCurrency(remaining)}
          </button>
        )}
        <button
          onClick={onOpenReturn}
          className="px-3 py-1.5 rounded-lg bg-error/10 text-error border border-error/20 text-[10px] font-bold hover:bg-error/20 transition-colors"
        >
          {t("vendorReturn.title")}
        </button>
      </div>
    </div>
  );
}

function AmountCell({ label, value, tone, prominent }: { label: string; value: string; tone?: string; prominent?: boolean }) {
  return (
    <div className="bg-surface-container-low rounded-lg px-3 py-2">
      <p className="text-[9px] text-outline mb-0.5">{label}</p>
      <p className={`font-data-table text-xs font-bold ${tone ?? (prominent ? "text-on-surface" : "text-on-surface-variant")}`}>{value}</p>
    </div>
  );
}