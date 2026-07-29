"use client";

import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { CustomerListItem } from "../types";
import CustomerRankBadge from "./CustomerRankBadge";

interface CustomersTableProps {
  customers: CustomerListItem[];
  loading: boolean;
  page: number;
  pages: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (customer: CustomerListItem) => void;
}

function formatDate(raw: string | null) {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function formatNumber(n: number) {
  return n.toLocaleString("ar-EG");
}

function getDebtColor(debt: string) {
  const n = parseFloat(debt);
  if (n === 0) return "text-secondary";
  if (n < 500) return "text-yellow-400";
  return "text-error";
}

export default function CustomersTable({
  customers,
  loading,
  page,
  pages,
  total,
  size,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-surface-container-high/50 border-b border-outline-variant">
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("customer.title")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.contact")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("customer.rank")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("customer.totalOrders")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("customer.totalSpent")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("customer.points")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("customer.debt")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("customer.lastPurchase")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-center">{t("common.status")}</th>
            <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 10 }).map((_, j) => (
                  <td key={j} className="px-card-padding py-4">
                    <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
                  </td>
                ))}
              </tr>
            ))
          ) : customers.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-card-padding py-16 text-center">
                <span className="material-symbols-outlined text-[40px] text-outline mb-2">group</span>
                <p className="text-on-surface-variant">{t("customer.noCustomers")}</p>
              </td>
            </tr>
          ) : (
            customers.map((c) => {
              const initials = c.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <tr
                  key={c.id}
                  className="hover:bg-surface-variant/10 transition-colors group cursor-pointer"
                  onClick={() => onView(c.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "inset 4px 0 0 #acc7ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <td className="px-card-padding py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{c.name}</div>
                        <div className="text-[11px] text-outline font-data-table">{t("common.id")}: {c.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-card-padding py-3">
                    <div className="text-sm text-on-surface">{c.email}</div>
                    <div className="text-[11px] text-outline">{c.phone ?? "—"}</div>
                  </td>
                  <td className="px-card-padding py-3">
                    <CustomerRankBadge rank={c.rank} />
                  </td>
                  <td className="px-card-padding py-3 text-right font-data-table text-on-surface text-sm">
                    {formatNumber(c.total_orders)}
                  </td>
                  <td className="px-card-padding py-3 text-right font-data-table text-primary text-sm">
                    {formatCurrency(c.total_spent)}
                  </td>
                  <td className="px-card-padding py-3 text-right font-data-table text-secondary text-sm">
                    {formatNumber(c.loyalty_points)}
                  </td>
                  <td className="px-card-padding py-3 text-right font-data-table text-sm">
                    <span className={getDebtColor(c.current_debt)}>
                      {formatCurrency(c.current_debt)}
                    </span>
                  </td>
                  <td className="px-card-padding py-3 text-right text-sm text-on-surface-variant">
                    {formatDate(c.last_purchase)}
                  </td>
                  <td className="px-card-padding py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" defaultChecked={c.is_active} className="sr-only peer" />
                      <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                    </label>
                  </td>
                  <td className="px-card-padding py-3">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(c)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant transition-colors"
                        title={t("customer.edit")}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-error/20 text-error transition-colors"
                        title={t("customer.delete")}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-card-padding py-4 bg-surface-container-high/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-body-md text-on-surface-variant">
            {t("common.showing")} <span className="text-on-surface font-semibold">{Math.min((page - 1) * size + 1, total)}-{Math.min(page * size, total)}</span> {t("common.of")}{" "}
            <span className="text-on-surface font-semibold">{total}</span> {t("customer.title")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-body-md text-on-surface-variant">{t("common.page")} {page} {t("common.of")} {pages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const p = start + i;
                if (p > pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      p === page
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-variant/20 hover:bg-surface-variant/40"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pages}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
