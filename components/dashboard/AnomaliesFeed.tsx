"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import type { CashierRefundAnomaly, CashierDiscountAnomaly, AnomalyThresholds } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { useTranslation } from "react-i18next";

function percent(value: number | string | null | undefined): string {
  if (value == null) return "٠%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return (num * 100).toLocaleString("ar-EG", { maximumFractionDigits: 1 }) + "%";
}

export default function AnomaliesFeed() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { startDate, endDate } = useDateRange();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);

  const refundQ = useQuery({
    queryKey: ["refundAnomalies", startDate, endDate],
    queryFn: () => reportsApi.refundAnomalies({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const discountQ = useQuery({
    queryKey: ["discountAnomalies", startDate, endDate],
    queryFn: () => reportsApi.discountAnomalies({ start_date: startDate, end_date: endDate }),
    enabled: !!accessToken,
  });
  const threshQ = useQuery({
    queryKey: ["anomalyThresholds"],
    queryFn: () => reportsApi.getAnomalyThresholds(),
    enabled: !!accessToken,
  });

  const refundData: CashierRefundAnomaly[] = Array.isArray(refundQ.data) ? refundQ.data : [];
  const discountData: CashierDiscountAnomaly[] = Array.isArray(discountQ.data) ? discountQ.data : [];

  const anomalyCount =
    refundData.filter((r) => r.is_refund_anomaly).length +
    discountData.filter((d) => d.is_discount_anomaly).length;

  const handleThresholdsSaved = useCallback(() => {
    setShowSettings(false);
    queryClient.invalidateQueries({ queryKey: ["refundAnomalies"] });
    queryClient.invalidateQueries({ queryKey: ["discountAnomalies"] });
    queryClient.invalidateQueries({ queryKey: ["anomalyThresholds"] });
  }, [queryClient]);

  const loading = refundQ.isLoading || discountQ.isLoading;

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 rounded bg-surface-container-highest/60" />
          <div className="h-5 w-5 rounded bg-surface-container-highest/60" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded bg-surface-container-highest/60" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-container-highest/40" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-3 w-32 rounded bg-surface-container-highest/60" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-container-highest/40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t("dashboard.anomalies.title")}</p>
          {anomalyCount > 0 && (
            <span className="text-[10px] bg-error/15 text-error px-2 py-0.5 rounded font-bold">
              {t("dashboard.anomalies.flaggedCount", { count: anomalyCount })}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors ${
            showSettings
              ? "bg-primary/15 text-primary"
              : "bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">tune</span>
          {t("dashboard.anomalies.thresholds")}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && threshQ.data && (
        <SettingsPanel
          thresholds={threshQ.data}
          onSaved={handleThresholdsSaved}
        />
      )}

      {/* Content */}
      {refundData.length === 0 && discountData.length === 0 &&
       !refundQ.error && !discountQ.error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <span className="material-symbols-outlined text-[36px] text-secondary mb-3">check_circle</span>
          <p className="text-sm text-on-surface-variant font-medium">{t("dashboard.anomalies.noAnomalies")}</p>
          <p className="text-[11px] text-on-surface-variant/60 mt-1">
            {t("dashboard.anomalies.noAnomaliesDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant/30 flex-1">
          {/* Refund Anomalies */}
          <div className="bg-surface-container-low p-card-padding">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-tertiary">emergency_home</span>
                {t("dashboard.anomalies.refundAnomalies")}
              </h3>
              <span className="text-[10px] text-on-surface-variant">
                {t("dashboard.anomalies.ofFlagged", { count: refundData.filter((r) => r.is_refund_anomaly).length, total: refundData.length })}
              </span>
            </div>
            {refundQ.error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant mb-2">error_outline</span>
                <p className="text-xs text-on-surface-variant">{refundQ.error?.message ?? t("common.unknownError")}</p>
              </div>
            ) : refundData.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8 text-xs">{t("dashboard.chart.noData")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                      <th className="pb-2 pe-2 font-semibold">{t("dashboard.anomalies.cashier")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.orders")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.refunds")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.rate")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.avgRate")}</th>
                      <th className="pb-2 font-semibold text-center">{t("dashboard.anomalies.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-xs">
                    {refundData.map((r) => {
                      const isAnomaly = r.is_refund_anomaly;
                      return (
                        <tr
                          key={r.user_id}
                          className={`transition-colors ${
                            isAnomaly
                              ? "bg-error-container/15 hover:bg-error-container/25"
                              : "hover:bg-surface-container-high"
                          }`}
                        >
                          <td className="py-2.5 pe-2 font-medium truncate max-w-[120px]" title={r.user_email ?? r.user_id}>
                            {r.user_email ?? r.user_id}
                          </td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">{r.order_count}</td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">{r.refund_count}</td>
                          <td className={`py-2.5 pe-2 text-end tabular-nums font-medium ${isAnomaly ? "text-error" : ""}`}>
                            {percent(r.refund_rate)}
                          </td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">
                            {percent(r.tenant_avg_refund_rate)}
                          </td>
                          <td className="py-2.5 text-center">
                            {isAnomaly ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error" title={t("dashboard.anomalies.cashierRateExceeds")}>
                                <span className="material-symbols-outlined text-[14px]">emergency</span>
                                {t("dashboard.anomalies.anomaly")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                {t("dashboard.anomalies.normal")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Discount Anomalies */}
          <div className="bg-surface-container-low p-card-padding">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">sell</span>
                {t("dashboard.anomalies.discountAnomalies")}
              </h3>
              <span className="text-[10px] text-on-surface-variant">
                {t("dashboard.anomalies.ofFlagged", { count: discountData.filter((d) => d.is_discount_anomaly).length, total: discountData.length })}
              </span>
            </div>
            {discountQ.error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant mb-2">error_outline</span>
                <p className="text-xs text-on-surface-variant">{discountQ.error?.message ?? t("common.unknownError")}</p>
              </div>
            ) : discountData.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8 text-xs">{t("dashboard.chart.noData")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/50">
                      <th className="pb-2 pe-2 font-semibold">{t("dashboard.anomalies.cashier")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.orders")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.discounts")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.rate")}</th>
                      <th className="pb-2 pe-2 font-semibold text-end">{t("dashboard.anomalies.avgRate")}</th>
                      <th className="pb-2 font-semibold text-center">{t("dashboard.anomalies.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-xs">
                    {discountData.map((d) => {
                      const isAnomaly = d.is_discount_anomaly;
                      return (
                        <tr
                          key={d.user_id}
                          className={`transition-colors ${
                            isAnomaly
                              ? "bg-error-container/15 hover:bg-error-container/25"
                              : "hover:bg-surface-container-high"
                          }`}
                        >
                          <td className="py-2.5 pe-2 font-medium truncate max-w-[120px]" title={d.user_email ?? d.user_id}>
                            {d.user_email ?? d.user_id}
                          </td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">{d.order_count}</td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">{d.discount_usage_count}</td>
                          <td className={`py-2.5 pe-2 text-end tabular-nums font-medium ${isAnomaly ? "text-error" : ""}`}>
                            {percent(d.discount_rate)}
                          </td>
                          <td className="py-2.5 pe-2 text-end tabular-nums text-on-surface-variant">
                            {percent(d.tenant_avg_discount_rate)}
                          </td>
                          <td className="py-2.5 text-center">
                            {isAnomaly ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error" title={t("dashboard.anomalies.cashierRateExceeds")}>
                                <span className="material-symbols-outlined text-[14px]">emergency</span>
                                {t("dashboard.anomalies.anomaly")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                {t("dashboard.anomalies.normal")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({
  thresholds,
  onSaved,
}: {
  thresholds: AnomalyThresholds;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [refundMultiplier, setRefundMultiplier] = useState(String(thresholds.refund_rate_alert_multiplier));
  const [discountMultiplier, setDiscountMultiplier] = useState(String(thresholds.discount_usage_alert_multiplier));
  const [reconThreshold, setReconThreshold] = useState(String(thresholds.reconciliation_discrepancy_alert_threshold));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    setError(null);
    setSuccess(false);

    const refund = parseFloat(refundMultiplier);
    const discount = parseFloat(discountMultiplier);
    const recon = parseFloat(reconThreshold);

    if (isNaN(refund) || refund <= 1.0) {
      setError(t("dashboard.anomalies.refundMultiplier") + " " + t("validation.positiveNumber"));
      return;
    }
    if (isNaN(discount) || discount <= 1.0) {
      setError(t("dashboard.anomalies.discountMultiplier") + " " + t("validation.positiveNumber"));
      return;
    }
    if (isNaN(recon) || recon <= 0) {
      setError(t("dashboard.anomalies.reconThreshold") + " " + t("validation.positiveNumber"));
      return;
    }

    setSaving(true);
    try {
      await reportsApi.updateAnomalyThresholds({
        refund_rate_alert_multiplier: refund,
        discount_usage_alert_multiplier: discount,
        reconciliation_discrepancy_alert_threshold: recon,
      });
      setSuccess(true);
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.failedToLoad"));
    } finally {
      setSaving(false);
    }
  }, [refundMultiplier, discountMultiplier, reconThreshold, onSaved]);

  return (
    <div className="border-b border-outline-variant bg-surface-container-low px-card-padding py-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
            {t("dashboard.anomalies.refundMultiplier")}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="1.1"
              value={refundMultiplier}
              onChange={(e) => setRefundMultiplier(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">×</span>
          </div>
            <p className="text-[9px] text-on-surface-variant/70 mt-1">{t("dashboard.anomalies.helpText")}</p>
        </div>
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
            {t("dashboard.anomalies.discountMultiplier")}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="1.1"
              value={discountMultiplier}
              onChange={(e) => setDiscountMultiplier(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">×</span>
          </div>
          <p className="text-[9px] text-on-surface-variant/70 mt-1">{t("dashboard.anomalies.helpText")}</p>
        </div>
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1.5">
            {t("dashboard.anomalies.reconThreshold")}
          </label>
          <div className="relative">
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={reconThreshold}
              onChange={(e) => setReconThreshold(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg pr-7 pl-3 py-2 text-sm tabular-nums text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <p className="text-[9px] text-on-surface-variant/70 mt-1">{t("dashboard.anomalies.reconHelpText")}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[11px] text-error mb-3 bg-error-container/15 px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-[11px] text-secondary mb-3 bg-secondary/10 px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          {t("dashboard.anomalies.updatedSuccess")}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t("dashboard.anomalies.saving") : t("dashboard.anomalies.saveChanges")}
        </button>
        <p className="text-[9px] text-on-surface-variant/60">
          {t("dashboard.anomalies.effectiveImmediately")}
        </p>
      </div>
    </div>
  );
}
