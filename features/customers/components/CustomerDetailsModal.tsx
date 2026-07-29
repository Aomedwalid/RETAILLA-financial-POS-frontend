"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { customersApi } from "../api";
import type { CustomerDetails, CustomerPurchase, PointsLedgerEntry } from "../types";
import CustomerRankBadge from "./CustomerRankBadge";

interface CustomerDetailsModalProps {
  customerId: string;
  onClose: () => void;
  customerName?: string;
  onEdit?: () => void;
  onDebt?: () => void;
  onRedeem?: () => void;
  onDelete?: () => void;
}

function getDebtColor(debt: string) {
  const n = parseFloat(debt);
  if (n === 0) return "text-secondary";
  if (n < 500) return "text-yellow-400";
  return "text-error";
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 text-center">
      <span className={`material-symbols-outlined ${color} text-2xl mb-1`}>{icon}</span>
      <p className={`font-headline-sm text-headline-sm leading-tight ${color}`}>{value}</p>
      <p className="text-label-caps font-label-caps text-outline mt-1">{label}</p>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-label-caps font-label-caps text-outline mb-1">{label}</p>
      <p className={`text-body-md text-on-surface break-words ${mono ? "font-data-table" : ""}`}>{value || "—"}</p>
    </div>
  );
}

export default function CustomerDetailsModal({ customerId, onClose, onEdit, onDebt, onRedeem, onDelete }: CustomerDetailsModalProps) {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPages, setPurchasesPages] = useState(1);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPages, setLedgerPages] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [tab, setTab] = useState<"overview" | "purchases" | "ledger">("overview");

  const size = 10;

  useEffect(() => {
    setLoading(true);
    setError("");
    customersApi.get(customerId)
      .then((data) => setCustomer(data))
      .catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad")))
      .finally(() => setLoading(false));
  }, [customerId]);

  const fetchPurchases = useCallback(async (pageNum: number) => {
    setPurchasesLoading(true);
    try {
      const result = await customersApi.getPurchases(customerId, { page: pageNum, size });
      setPurchases(result.items);
      setPurchasesTotal(result.total);
      setPurchasesPages(result.pages);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (tab === "purchases") {
      fetchPurchases(purchasesPage);
    }
  }, [tab, purchasesPage, fetchPurchases]);

  const fetchLedger = useCallback(async (pageNum: number) => {
    setLedgerLoading(true);
    try {
      const result = await customersApi.getPointsLedger(customerId, { page: pageNum, size });
      setLedger(result.items);
      setLedgerTotal(result.total);
      setLedgerPages(result.pages);
    } catch {
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (tab === "ledger") {
      fetchLedger(ledgerPage);
    }
  }, [tab, ledgerPage, fetchLedger]);

  const initials = customer?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-[95vw] md:w-full max-w-3xl bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0 border border-primary/30">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight truncate">
                  {loading ? t("common.loading") : customer?.name ?? t("customer.details")}
                </h3>
                {!loading && customer && <CustomerRankBadge rank={customer.rank} />}
              </div>
              {!loading && customer && (
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[12px] text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">mail</span>
                    {customer.email}
                  </p>
                  {customer.phone && (
                    <p className="text-[12px] text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      {customer.phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {loading && (
            <div className="p-6 space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-3 w-16 rounded bg-surface-container-highest/60" />
                  <div className="h-5 w-3/4 rounded bg-surface-container-highest/60" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[40px] text-error mb-3">error</span>
              <p className="text-body-md text-error">{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  customersApi.get(customerId).then(setCustomer).catch((err) => setError(err instanceof Error ? err.message : t("common.failedToLoad"))).finally(() => setLoading(false));
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                {t("common.retry")}
              </button>
            </div>
          )}

          {customer && !loading && (
            <>
              {/* Statistics Cards */}
              <div className="p-6 pb-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label={t("customer.totalSpent")} value={formatCurrency(customer.total_spent)} color="text-primary" icon="payments" />
                  <StatCard label={t("customer.totalOrders")} value={formatNumber(customer.total_orders)} color="text-on-surface" icon="receipt_long" />
                  <StatCard label={t("customer.loyaltyPoints")} value={formatNumber(customer.loyalty_points)} color="text-secondary" icon="stars" />
                  <StatCard label={t("customer.lifetimePoints")} value={formatNumber(customer.lifetime_points_earned)} color="text-secondary" icon="trending_up" />
                  <StatCard label={t("customer.currentDebt")} value={formatCurrency(customer.current_debt)} color={getDebtColor(customer.current_debt)} icon="account_balance" />
                  <StatCard label={t("customer.subscriptionBonus")} value={customer.subscription_bonus_granted ? t("common.yes") : t("common.no")} color={customer.subscription_bonus_granted ? "text-secondary" : "text-outline"} icon="card_giftcard" />
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-6 border-b border-outline-variant flex gap-6 flex-wrap">
                {[
                  { key: "overview" as const, label: t("customer.overview") },
                  { key: "purchases" as const, label: t("customer.purchaseHistory") },
                  { key: "ledger" as const, label: t("customer.pointsLedger") },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); if (t.key === "purchases") setPurchasesPage(1); if (t.key === "ledger") setLedgerPage(1); }}
                    className={`pb-3 font-bold text-sm transition-all border-b-2 ${
                      tab === t.key
                        ? "text-primary border-primary"
                        : "text-on-surface-variant border-transparent hover:text-on-surface"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {tab === "overview" && (
                <div className="p-6 space-y-6">
                  <section>
                    <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("customer.information")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <Field label={t("customer.name")} value={customer.name} />
                      <Field label={t("customer.email")} value={customer.email} />
                      <Field label={t("customer.phone")} value={customer.phone ?? "—"} />
                      <Field label={t("customer.rank")} value={customer.rank} />
                      <Field label={t("customer.lastPurchase")} value={formatDateTime(customer.last_purchase)} />
                    </div>
                  </section>

                  <section className="border-t border-outline-variant pt-6">
                    <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("customer.timeline")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <Field label={t("customer.createdAt")} value={formatDateTime(customer.created_at)} />
                      <Field label={t("customer.updatedAt")} value={formatDateTime(customer.updated_at)} />
                      <Field label={t("customer.lastPurchase")} value={formatDateTime(customer.last_purchase)} />
                    </div>
                  </section>
                </div>
              )}

              {/* Purchase History Tab */}
              {tab === "purchases" && (
                <div className="p-6">
                  {purchasesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse h-12 rounded bg-surface-container-highest/60" />
                      ))}
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-[40px] text-outline mb-2">receipt_long</span>
                      <p className="text-on-surface-variant">{t("customer.noPurchases")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
                        <table className="w-full text-right">
                          <thead className="bg-surface-container-high/50">
                            <tr>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline">{t("common.id")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline">{t("customer.status")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("customer.totalSpent")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("productForm.discount")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("common.total")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("common.date")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant">
                            {purchases.map((p) => {
                              const statusColor =
                                p.status === "COMPLETED" ? "text-secondary" :
                                p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED" ? "text-yellow-400" :
                                "text-error";
                              return (
                                <tr key={p.id} className="hover:bg-surface-variant/10 transition-colors">
                                  <td className="px-4 py-3 font-data-table text-primary text-sm">#{p.id.slice(0, 8).toUpperCase()}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor} bg-current/10`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-data-table text-on-surface text-sm">{formatCurrency(p.subtotal)}</td>
                                  <td className="px-4 py-3 text-right font-data-table text-on-surface text-sm">{formatCurrency(p.total_discount)}</td>
                                  <td className="px-4 py-3 text-right font-data-table text-primary text-sm">{formatCurrency(p.total)}</td>
                                  <td className="px-4 py-3 text-right text-sm text-on-surface-variant">{formatDate(p.created_at)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {purchasesPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <button
                            onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
                            disabled={purchasesPage <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                          <span className="text-xs text-on-surface-variant">{t("common.page")} {purchasesPage} {t("common.of")} {purchasesPages}</span>
                          <button
                            onClick={() => setPurchasesPage((p) => Math.min(purchasesPages, p + 1))}
                            disabled={purchasesPage >= purchasesPages}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Points Ledger Tab */}
              {tab === "ledger" && (
                <div className="p-6">
                  {ledgerLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse h-12 rounded bg-surface-container-highest/60" />
                      ))}
                    </div>
                  ) : ledger.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-[40px] text-outline mb-2">history</span>
                      <p className="text-on-surface-variant">{t("customer.noLedger")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
                        <table className="w-full text-right">
                          <thead className="bg-surface-container-high/50">
                            <tr>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline">{t("customer.points")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline">{t("customer.status")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("customerDetail.expirationDate")}</th>
                              <th className="px-4 py-3 font-label-caps text-label-caps text-outline text-right">{t("customerDetail.earnedDate")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant">
                            {ledger.map((entry) => (
                              <tr key={entry.id} className={`transition-colors ${entry.redeemed ? "opacity-50" : "hover:bg-surface-variant/10"}`}>
                                <td className="px-4 py-3 font-data-table text-sm">
                                  <span className={entry.redeemed ? "text-error" : "text-secondary"}>
                                    {entry.redeemed ? `-${entry.points}` : `+${entry.points}`}
                                  </span>
                                </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      entry.redeemed
                                        ? "bg-surface-variant/30 text-outline"
                                        : "bg-secondary/10 text-secondary"
                                    }`}>
                                      {entry.redeemed ? t("customerDetail.redeemed") : t("customerDetail.active")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                                    {formatDate(entry.expiration_date)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                                    {formatDate(entry.earned_date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {ledgerPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <button
                            onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                            disabled={ledgerPage <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                          <span className="text-xs text-on-surface-variant">{t("common.page")} {ledgerPage} {t("common.of")} {ledgerPages}</span>
                          <button
                            onClick={() => setLedgerPage((p) => Math.min(ledgerPages, p + 1))}
                            disabled={ledgerPage >= ledgerPages}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {onEdit && (
              <button onClick={onEdit} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                {t("common.edit")}
              </button>
            )}
            {onDebt && (
              <button onClick={onDebt} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                {t("customer.debt")}
              </button>
            )}
            {onRedeem && (
              <button onClick={onRedeem} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[16px]">stars</span>
                {t("customer.redeem")}
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="px-4 py-2 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {t("common.delete")}
              </button>
            )}
          </div>
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform text-sm">
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
