"use client";

import { useTranslation } from "react-i18next";
import { useOutstandingBills } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";
import { toNum } from "@/features/vendors/types";
import { formatDate, isOverdue } from "./utils";

export default function OutstandingBillsWidget() {
  const { t } = useTranslation();
  const { data: bills = [], isLoading } = useOutstandingBills();

  if (isLoading) {
    return (
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-surface-container-highest/60" />
        <div className="h-12 rounded bg-surface-container-highest/40" />
        <div className="h-12 rounded bg-surface-container-highest/40" />
      </div>
    );
  }

  if (bills.length === 0) return null;

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-sm text-error">priority_high</span>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendor.billsDueSoon")} ({bills.length})</h4>
      </div>
      <div className="space-y-2">
        {bills.slice(0, 10).map((b) => {
          const overdue = isOverdue(b.due_date, b.status);
          return (
            <div key={b.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-xs ${overdue ? "bg-error/5 border border-error/10" : "bg-surface-container-highest"}`}>
              <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
                <span className="text-on-surface-variant truncate max-w-[120px]">{b.vendor_name}</span>
                <span className="text-outline">{b.bill_reference || b.id.slice(0, 8)}</span>
                {b.due_date && (
                  <span className={`text-[10px] ${overdue ? "text-error font-semibold" : "text-outline"}`}>
                    {overdue ? t("vendor.overdueLabel") : `${t("vendor.due")} ${formatDate(b.due_date)}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-outline">{formatCurrency(b.amount_remaining)} {t("vendor.left")}</span>
                <span className={`font-data-table font-bold ${overdue ? "text-error" : "text-on-surface"}`}>{formatCurrency(toNum(b.amount))}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}