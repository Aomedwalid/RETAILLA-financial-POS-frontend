"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVendorBills } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";
import { billNet, toNum } from "@/features/vendors/types";
import type { BillResponse } from "@/features/vendors/types";
import { formatDate, isOverdue } from "./utils";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import BillDetailPanel from "./BillDetailPanel";
import PayBillModal from "./PayBillModal";
import VendorReturnModal from "./VendorReturnModal";

export default function VendorBillsTab({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation();
  const { data: bills = [], isLoading, isError, refetch } = useVendorBills(vendorId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [returnFor, setReturnFor] = useState<BillResponse | null>(null);
  const [payFor, setPayFor] = useState<BillResponse | null>(null);

  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (isLoading) {
    return (
      <div className="p-5 space-y-3 animate-pulse">
        <div className="h-10 rounded-xl bg-surface-container-highest/40" />
        <div className="h-24 rounded-xl bg-surface-container-highest/40" />
        <div className="h-24 rounded-xl bg-surface-container-highest/40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="material-symbols-outlined text-[48px] text-error mb-3">error</span>
        <p className="text-sm text-error">{t("vendor.bill.failedToLoad")}</p>
        <button onClick={() => refetch()} className="mt-4 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold">{t("common.retry")}</button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <p className="text-xs text-on-surface-variant">{bills.length} {t("vendor.bill", { count: bills.length })}</p>
      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="material-symbols-outlined text-[40px] text-outline mb-2">receipt</span>
          <p className="text-sm text-on-surface-variant">{t("vendor.noBills")}</p>
          <p className="text-xs text-outline mt-1">{t("vendor.billsAfterConfirm")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBills.map((bill) => {
            const overdue = isOverdue(bill.due_date, bill.status);
            const displayStatus = overdue ? "OVERDUE" : bill.status;
            const net = billNet(bill);
            const paid = toNum(bill.amount_paid);
            const remaining = Math.max(0, toNum(bill.amount_remaining));
            const isExpanded = expandedId === bill.id;
            return (
              <div
                key={bill.id}
                className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setExpandedId((prev) => (prev === bill.id ? null : bill.id))}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-on-surface truncate">{bill.bill_reference || `#${bill.id.slice(0, 8)}`}</span>
                      <StatusBadge status={displayStatus} />
                    </div>
                    <span className="font-data-table text-sm font-bold text-on-surface shrink-0">{formatCurrency(net)}</span>
                  </div>

                  {(bill.status === "PAID" || bill.status === "PARTIALLY_PAID") && (
                    <div className="mb-2">
                      <ProgressBar paid={paid} total={net} status={bill.status} />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-outline flex-wrap gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {bill.due_date && (
                        <span className={overdue ? "text-error font-semibold" : ""}>
                          {t("vendor.due")} {formatDate(bill.due_date)}
                        </span>
                      )}
                      {remaining > 0 && <span className="text-error">{formatCurrency(remaining)} {t("vendor.remaining")}</span>}
                    </div>
                    {bill.status !== "PAID" && (
                      <PayBillModal vendorId={vendorId} bill={bill} onDone={() => refetch()} />
                    )}
                  </div>
                  {bill.notes && <p className="text-[10px] text-outline mt-2">{bill.notes}</p>}
                </div>

                {isExpanded && (
                  <BillDetailPanel
                    vendorId={vendorId}
                    bill={bill}
                    onOpenPay={() => setPayFor(bill)}
                    onOpenReturn={() => setReturnFor(bill)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {returnFor && (
        <VendorReturnModal vendorId={vendorId} bill={returnFor} onClose={() => setReturnFor(null)} />
      )}
      {payFor && (
        <PayBillModal vendorId={vendorId} bill={payFor} onDone={() => { setPayFor(null); refetch(); }} />
      )}
    </div>
  );
}