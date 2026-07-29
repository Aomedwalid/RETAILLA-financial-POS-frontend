"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { BillResponse } from "@/features/vendors/types";
import { fmt } from "@/features/vendors/types";
import { vendorsApi } from "@/features/vendors/api";
import { productsApi } from "@/features/products/api";
import { formatDate, isOverdue } from "./utils";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import PayBillModal from "./PayBillModal";

interface BillsTabProps {
  vendorId: string;
  bills: BillResponse[];
  onUpdated: () => void;
}

export default function BillsTab({ vendorId, bills, onUpdated }: BillsTabProps) {
  const { t } = useTranslation();
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [poData, setPoData] = useState<Record<string, { lines: { name: string; qty: number; cost: string }[]; total: number }>>({});
  const [loadingPo, setLoadingPo] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedBill) return;
    const bill = bills.find((b) => b.id === expandedBill);
    if (!bill || !bill.po_id || poData[bill.po_id]) return;
    setLoadingPo(bill.po_id);
    vendorsApi.listPOs(vendorId).then(async (allPos) => {
      const po = allPos.find((p) => p.id === bill.po_id);
      if (!po) { setLoadingPo(null); return; }
      const variantIds = new Set(po.lines.map((l) => l.variant_id));
      let productMap: Record<string, string> = {};
      try {
        const res = await productsApi.list({ size: 1000 });
        for (const p of res.items) {
          if (p.variants) {
            for (const v of p.variants) {
              if (variantIds.has(v.id)) productMap[v.id] = p.name;
            }
          }
        }
      } catch {}
      const total = po.lines.reduce((s, l) => s + l.quantity * parseFloat(l.unit_cost), 0);
      setPoData((prev) => ({
        ...prev,
        [po.id]: {
          total,
          lines: po.lines.map((l) => ({
            name: productMap[l.variant_id] || l.variant_id.slice(0, 12) + "...",
            qty: l.quantity,
            cost: l.unit_cost,
          })),
        },
      }));
      setLoadingPo(null);
    }).catch(() => setLoadingPo(null));
  }, [expandedBill, bills, vendorId, poData]);

  function toggleExpand(billId: string) {
    setExpandedBill((prev) => (prev === billId ? null : billId));
  }

  function handlePaymentDone(updatedBill?: BillResponse) {
    if (updatedBill) {
      // Immediately update local state with the returned bill
      const index = bills.findIndex((b) => b.id === updatedBill.id);
      if (index >= 0) {
        bills[index] = updatedBill;
      }
    }
    onUpdated();
  }

  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
            const isExpanded = expandedBill === bill.id;
            const poInfo = bill.po_id ? poData[bill.po_id] : null;
            const isLoading = bill.po_id && loadingPo === bill.po_id;
            return (
              <div
                key={bill.id}
                className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => toggleExpand(bill.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-on-surface truncate">{bill.bill_reference || `#${bill.id.slice(0, 8)}`}</span>
                      <StatusBadge status={displayStatus} />
                    </div>
                    <span className="font-data-table text-sm font-bold text-on-surface shrink-0">{fmt(bill.amount)}</span>
                  </div>

                  {(bill.status === "PAID" || bill.status === "PARTIALLY_PAID") && (
                    <div className="mb-2">
                      <ProgressBar paid={bill.amount_paid} total={bill.amount} status={bill.status} />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-outline flex-wrap gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {bill.due_date && (
                        <span className={overdue ? "text-error font-semibold" : ""}>
                          {t("vendor.due")} {formatDate(bill.due_date)}
                        </span>
                      )}
                      {parseFloat(bill.amount_remaining || "0") > 0 && (
                        <span className="text-error">{fmt(bill.amount_remaining)} {t("vendor.remaining")}</span>
                      )}
                    </div>
                    {bill.status !== "PAID" && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <PayBillModal vendorId={vendorId} bill={bill} onDone={handlePaymentDone} />
                      </div>
                    )}
                  </div>
                  {bill.notes && <p className="text-[10px] text-outline mt-2">{bill.notes}</p>}
                </div>

                {isExpanded && (
                  <div className="border-t border-outline-variant/50 bg-surface-container-highest/50 px-4 py-3 space-y-2">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-outline">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        {t("vendor.loadingProductDetails")}
                      </div>
                    ) : poInfo ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendor.poLines")}</p>
                        {poInfo.lines.map((line, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant truncate max-w-[200px]">{line.name}</span>
                            <span className="text-outline">{line.qty} &times; {fmt(line.cost)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold text-on-surface border-t border-outline-variant/40 pt-2">
                          <span className="text-outline">{t("vendor.poTotal")}</span>
                          <span>{fmt(poInfo.total)}</span>
                        </div>
                      </>
                    ) : bill.po_id ? (
                      <p className="text-xs text-outline">{t("vendor.noPODetails")}</p>
                    ) : (
                      <p className="text-xs text-outline">{t("vendor.manualBillNoPO")}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
