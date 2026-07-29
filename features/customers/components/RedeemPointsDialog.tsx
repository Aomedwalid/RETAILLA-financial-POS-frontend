"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/format";
import { customersApi } from "../api";
import { validatePoints } from "../validation";
import type { CustomerListItem } from "../types";

interface RedeemPointsDialogProps {
  customer: CustomerListItem;
  onClose: () => void;
  onRedeemed: () => void;
}

export default function RedeemPointsDialog({ customer, onClose, onRedeemed }: RedeemPointsDialogProps) {
  const { t } = useTranslation();
  const [points, setPoints] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const err = validatePoints(points, customer.loyalty_points);
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      await customersApi.redeemPoints(customer.id, {
        points: parseInt(points, 10),
      });
      onRedeemed();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.failedToLoad"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div
        className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("customer.redeemPoints")}</h3>
          <p className="text-[12px] text-outline mt-1">{t("customer.name")}: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
            <span className="text-on-surface-variant">{t("customer.pointsAvailable")}</span>
            <span className="font-data-table text-headline-sm text-secondary">
              {formatNumber(customer.loyalty_points)}
            </span>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("customer.points")}</label>
            <input
              type="number"
              min="0"
              max={customer.loyalty_points}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 outline-none focus:ring-1 focus:ring-primary text-headline-sm font-data-table text-center"
              placeholder={t("customer.points")}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-6 bg-surface-container-high/80 border-t border-outline-variant flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-lg bg-secondary text-on-secondary font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("customer.redeem")}
          </button>
        </div>
      </div>
    </div>
  );
}
