"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi, type StoreOverview } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { Package, Receipt, RotateCcw, Users, Tag, Gift, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const CARD_META: {
  key: keyof StoreOverview;
  labelKey: string;
  icon: React.ReactNode;
  border: string;
  text: string;
}[] = [
  { key: "total_products", labelKey: "dashboard.storeOverview.products", icon: <Package size={18} />, border: "border-s-primary", text: "text-primary" },
  { key: "total_orders", labelKey: "dashboard.storeOverview.orders", icon: <Receipt size={18} />, border: "border-s-secondary", text: "text-secondary" },
  { key: "total_refunds", labelKey: "dashboard.storeOverview.refunds", icon: <RotateCcw size={18} />, border: "border-s-error", text: "text-error" },
  { key: "total_customers", labelKey: "dashboard.storeOverview.customers", icon: <Users size={18} />, border: "border-s-tertiary", text: "text-tertiary" },
  { key: "total_discounts", labelKey: "dashboard.storeOverview.discounts", icon: <Tag size={18} />, border: "border-s-primary-fixed-dim", text: "text-primary-fixed-dim" },
  { key: "total_promo_codes", labelKey: "dashboard.storeOverview.promoCodes", icon: <Gift size={18} />, border: "border-s-secondary-fixed-dim", text: "text-secondary-fixed-dim" },
  { key: "total_team_members", labelKey: "dashboard.storeOverview.team", icon: <UserCheck size={18} />, border: "border-s-tertiary-fixed-dim", text: "text-tertiary-fixed-dim" },
];

function SkeletonCard() {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 border-s-4 border-surface-container-highest animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-8 w-8 rounded-lg bg-surface-container-highest/60" />
      </div>
      <div className="h-7 w-20 rounded bg-surface-container-highest/60" />
    </div>
  );
}

export default function StoreOverviewCards() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate, displayLabel } = useDateRange();
  const { data, isLoading } = useQuery({
    queryKey: ["storeOverview", startDate, endDate],
    queryFn: () => reportsApi.overview({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-gutter">
        {CARD_META.map((m) => <SkeletonCard key={m.key} />)}
      </div>
    );
  }

  const allZero = data && Object.values(data).every((v) => v === 0);

  if (allZero) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6">
        <p className="text-label-caps text-on-surface-variant uppercase mb-1">{t("dashboard.storeOverview.title")}</p>
        <p className="text-[10px] text-on-surface-variant/60 mb-4">{displayLabel}</p>
        <div className="flex items-center gap-6 flex-wrap">
          <p className="text-sm text-on-surface-variant">{t("dashboard.storeOverview.welcome")}</p>
          <span className="material-symbols-outlined text-3xl text-primary/40">rocket_launch</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3 px-1">
        <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.storeOverview.title")}</p>
        <p className="text-[10px] text-on-surface-variant/60">{displayLabel}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-gutter">
        {CARD_META.map((m) => {
          const value = data?.[m.key] ?? 0;
          return (
            <div key={m.key} className={`bg-surface-container-low rounded-xl border border-outline-variant p-4 border-s-4 ${m.border} transition-all hover:border-opacity-80`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-1.5 rounded-lg bg-surface-container-low ${m.text}`}>
                  {m.icon}
                </div>
              </div>
              <p className="text-2xl font-bold font-data-table text-on-surface mb-0.5">
                {value.toLocaleString("ar-EG")}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                {t(m.labelKey)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
