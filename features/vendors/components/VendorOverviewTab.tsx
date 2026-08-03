"use client";

import { useTranslation } from "react-i18next";
import { useVendorOverview, useVendorStatement, useOutstandingBills } from "@/features/vendors/hooks";
import { formatCurrency } from "@/lib/format";
import { toNum } from "@/features/vendors/types";
import type { VendorResponse } from "@/features/vendors/types";
import { formatDate } from "./utils";

interface OverviewTabProps {
  vendor: VendorResponse;
}

export default function VendorOverviewTab({ vendor }: OverviewTabProps) {
  const { t } = useTranslation();
  const { data: overview, isLoading, isError } = useVendorOverview(vendor.id);
  const { data: statement } = useVendorStatement(vendor.id);
  const { data: allOutstanding = [] } = useOutstandingBills();

  const bal = toNum(vendor.outstanding_balance);
  const outstandingBills = allOutstanding.filter((b) => b.vendor_id === vendor.id);
  const availableCredit = toNum(statement?.available_credit);

  return (
    <div className="p-5 space-y-5">
      {/* Vendor Info Card */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-surface-container-high border-b border-outline-variant/50">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendor.information")}</h4>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <InfoRow label={t("common.contact")} value={vendor.contact_name || "\u2014"} />
          <InfoRow label={t("common.email")} value={vendor.contact_email || "\u2014"} />
          <InfoRow label={t("common.phone")} value={vendor.contact_phone || "\u2014"} />
          <InfoRow label={t("vendor.paymentTerms")} value={vendor.payment_terms_days ? `${vendor.payment_terms_days} ${t("common.day")}` : "\u2014"} />
          <InfoRow label={t("vendor.outstandingBalance")} value={formatCurrency(bal)} mono />
          <InfoRow label={t("customer.lastPurchase")} value={formatDate(vendor.last_purchase_at)} />
          <InfoRow label={t("vendorStatement.availableCredit")} value={formatCurrency(availableCredit)} mono />
        </div>
      </div>

      {/* Dashboard Stats */}
      {isLoading ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-surface-container-highest/60" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-surface-container-highest/60" />
            ))}
          </div>
        </div>
      ) : isError || !overview ? null : (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-surface-container-high border-b border-outline-variant/50">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendor.dashboard")}</h4>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t("vendor.totalSpent")} value={formatCurrency(overview.total_spent)} icon="payments" color="text-primary" bgColor="bg-primary/10" />
              <StatCard label={t("vendor.outstanding")} value={formatCurrency(overview.total_outstanding)} icon="account_balance" color="text-error" bgColor="bg-error/10" />
              <StatCard label={t("vendor.totalBills")} value={String(overview.total_bills)} icon="receipt_long" color="text-on-surface" bgColor="bg-surface-container-highest" />
              <StatCard label={t("vendor.avgBill")} value={formatCurrency(overview.average_bill_amount)} icon="trending_up" color="text-secondary" bgColor="bg-secondary/10" />
            </div>

            {overview.recent_bills.length > 0 && (
              <div className="border-t border-outline-variant/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-sm text-outline">history</span>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">{t("vendor.recentBills")}</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="text-[10px] font-bold uppercase tracking-wider text-outline pb-2 pr-4">{t("vendor.billReference")}</th>
                        <th className="text-[10px] font-bold uppercase tracking-wider text-outline pb-2 pr-4">{t("common.amount")}</th>
                        <th className="text-[10px] font-bold uppercase tracking-wider text-outline pb-2 pr-4">{t("vendor.dueDate")}</th>
                        <th className="text-[10px] font-bold uppercase tracking-wider text-outline pb-2">{t("common.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {overview.recent_bills.map((b) => (
                        <tr key={b.id}>
                          <td className="py-2 pr-4 text-xs text-on-surface-variant">{b.bill_reference || b.id.slice(0, 8)}</td>
                          <td className="py-2 pr-4 text-xs font-data-table text-on-surface">{formatCurrency(toNum(b.amount))}</td>
                          <td className="py-2 pr-4 text-xs text-outline">{formatDate(b.due_date)}</td>
                          <td className="py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              b.status === "PAID" ? "bg-secondary/10 text-secondary" :
                              b.status === "PARTIALLY_PAID" ? "bg-[#d99c00]/10 text-[#d99c00]" :
                              "bg-error/10 text-error"
                            }`}>
                              {b.status === "PARTIALLY_PAID" ? t("vendor.status.partial") : b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {overview.recent_bills.length === 0 && (
              <div className="flex items-center justify-center py-6 text-sm text-outline border-t border-outline-variant/50 pt-4">
                <span className="material-symbols-outlined text-sm mr-2">receipt</span>
                {t("vendor.noRecentBills")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outstanding Bills Alert */}
      {outstandingBills.length > 0 && (
        <div className="bg-surface-container-low border border-error/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-error/5 border-b border-error/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-error">priority_high</span>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-error">
              {t("vendor.outstandingBills")} ({outstandingBills.length})
            </h4>
          </div>
          <div className="p-5 space-y-2">
            {outstandingBills.map((b) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-highest rounded-lg px-4 py-3 text-xs hover:bg-surface-container-highest/80 transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-on-surface-variant font-medium">{b.bill_reference || b.id.slice(0, 8)}</span>
                  {b.due_date && (
                    <span className="text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                      {t("vendor.due")} {formatDate(b.due_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-outline">{formatCurrency(b.amount_remaining)} {t("vendor.remaining")}</span>
                  <span className="font-data-table text-on-surface font-bold">{formatCurrency(toNum(b.amount))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-outline mb-0.5">{label}</p>
      <p className={`text-sm text-on-surface ${mono ? "font-data-table" : ""}`}>{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon, color, bgColor }: { label: string; value: string; icon: string; color: string; bgColor: string }) {
  return (
    <div className={`${bgColor} rounded-xl px-4 py-3.5 border border-outline-variant/30`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
        <span className="text-[10px] text-outline font-medium">{label}</span>
      </div>
      <p className={`font-data-table text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}