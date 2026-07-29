"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

function formatVolume(value: number | string | null | undefined, t: (key: string) => string): string {
  if (value == null) return `0 ${t("common.transaction")}`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toLocaleString("ar-EG")} ${t("common.transaction")}`;
}

export default function LocationPerformanceTable() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["locations"],
    queryFn: () => reportsApi.locations(),
    enabled: !!accessToken,
  });

  const locations = Array.isArray(data) ? data : [];
  const maxSales = locations.length > 0
    ? Math.max(...locations.map((l: { total_sales: number | string }) => parseFloat(String(l.total_sales))))
    : 1;

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden animate-pulse">
        <div className="p-card-padding border-b border-outline-variant flex justify-between items-center">
          <div className="h-3 w-36 rounded bg-surface-container-highest/60" />
          <div className="h-3 w-24 rounded bg-surface-container-highest/60" />
        </div>
        <div className="space-y-4 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-5 w-40 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-20 rounded bg-surface-container-highest/60" />
              <div className="h-5 flex-1 rounded bg-surface-container-highest/60" />
              <div className="h-5 w-28 rounded bg-surface-container-highest/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.locationPerformance.title")}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs text-on-surface-variant">{t("dashboard.locationPerformance.failed")}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex justify-between items-center">
          <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.locationPerformance.title")}</p>
          <button className="text-xs text-primary font-bold">{t("dashboard.locationPerformance.viewAll")} 42 {t("dashboard.locationPerformance.stores")}</button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs text-on-surface-variant">{t("dashboard.locationPerformance.noData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden flex flex-col">
      <div className="p-card-padding border-b border-outline-variant flex justify-between items-center">
        <p className="text-label-caps text-on-surface-variant uppercase">{t("dashboard.locationPerformance.title")}</p>
        <button className="text-xs text-primary font-bold">
          {t("dashboard.locationPerformance.viewAll")} {locations.length} {t("dashboard.locationPerformance.stores")}
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-start">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-6 py-4 text-label-caps text-on-surface-variant uppercase font-semibold text-start">{t("dashboard.locationPerformance.location")}</th>
              <th className="px-6 py-4 text-label-caps text-on-surface-variant uppercase font-semibold text-start">{t("dashboard.locationPerformance.volume")}</th>
              <th className="px-6 py-4 text-label-caps text-on-surface-variant uppercase font-semibold text-start">{t("dashboard.locationPerformance.revenueTrend")}</th>
              <th className="px-6 py-4 text-label-caps text-on-surface-variant uppercase font-semibold text-end">{t("dashboard.locationPerformance.revenue")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {locations.map((loc: { location_id?: string; location_name: string; total_sales: number | string; total_refunds?: number | string; total_expenses?: number | string; net_cash_position?: number | string }, idx: number) => {
              const sales = parseFloat(String(loc.total_sales));
              const barPct = (sales / maxSales) * 100;
              let barColor = "bg-secondary";
              if (barPct < 30) barColor = "bg-error";
              else if (barPct < 60) barColor = "bg-primary";

              return (
                <tr
                  key={loc.location_id ?? idx}
                  className="hover:bg-surface-container-high transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium">{loc.location_name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {formatVolume(loc.total_sales, t)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 w-32 h-6">
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-end font-data-table">
                    <span className={sales >= 0 ? "text-secondary" : "text-error"}>
                      {formatCurrency(sales)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
