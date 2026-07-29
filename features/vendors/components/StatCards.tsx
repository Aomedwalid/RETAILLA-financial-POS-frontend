import { useTranslation } from "react-i18next";
import { fmt } from "@/features/vendors/types";

interface StatCardsProps {
  totalVendors: number;
  totalOutstanding: number;
  avgBalance: number;
  withBalance: number;
}

export default function StatCards({ totalVendors, totalOutstanding, avgBalance, withBalance }: StatCardsProps) {
  const { t } = useTranslation();
  const stats = [
    { label: t("vendor.stat.totalVendors"), value: String(totalVendors), icon: "conveyor_belt", color: "text-primary" },
    { label: t("vendor.stat.outstanding"), value: fmt(totalOutstanding), icon: "account_balance", color: "text-error" },
    { label: t("vendor.stat.avgBalance"), value: fmt(avgBalance), icon: "trending_up", color: "text-secondary" },
    { label: t("vendor.stat.withBalance"), value: String(withBalance), icon: "receipt_long", color: "text-primary-fixed-dim" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`material-symbols-outlined text-sm ${s.color}`}>{s.icon}</span>
            <span className="text-[10px] text-outline font-medium">{s.label}</span>
          </div>
          <span className={`font-data-table text-lg font-bold ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}