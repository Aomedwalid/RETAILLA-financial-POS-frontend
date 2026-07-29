"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { CustomerListItem } from "../types";

interface StatsCardsProps {
  customers: CustomerListItem[];
  loading: boolean;
}

function formatNumber(n: number) {
  return n.toLocaleString("ar-EG");
}

function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-caps font-label-caps text-outline mb-1">{label}</p>
          <p className={`font-headline-sm text-headline-sm ${color}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined ${color} opacity-60`}>{icon}</span>
      </div>
    </div>
  );
}

export default function CustomerStatsCards({ customers, loading }: StatsCardsProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-gutter">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
            <div className="h-3 w-24 rounded bg-surface-container-highest/60 mb-3" />
            <div className="h-6 w-20 rounded bg-surface-container-highest/60" />
          </div>
        ))}
      </div>
    );
  }

  const total = customers.length;
  const active = customers.filter((c) => c.is_active).length;
  const points = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const debt = customers.reduce((sum, c) => sum + parseFloat(c.current_debt || "0"), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-gutter">
      <MetricCard label={t("stats.totalCustomers")} value={formatNumber(total)} color="text-primary" icon="group" />
      <MetricCard label={t("customer.active")} value={formatNumber(active)} color="text-secondary" icon="check_circle" />
      <MetricCard label={t("customer.loyaltyPoints")} value={formatNumber(points)} color="text-secondary" icon="stars" />
      <MetricCard label={t("customer.debt")} value={formatCurrency(debt)} color={debt > 0 ? "text-error" : "text-on-surface"} icon="account_balance" />
    </div>
  );
}
