"use client";

import { useTranslation } from "react-i18next";
import type { VendorStatementEvent } from "@/features/vendors/types";
import { useVendorStatement } from "@/features/vendors/hooks";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toNum } from "@/features/vendors/types";

interface StatementTabProps {
  vendorId: string;
}

const EVENT_META: Record<string, { icon: string; tone: string }> = {
  PURCHASE_ORDER: { icon: "shopping_cart", tone: "text-outline" },
  BILL: { icon: "receipt_long", tone: "text-primary" },
  PAYMENT: { icon: "payments", tone: "text-secondary" },
  RETURN: { icon: "assignment_return", tone: "text-error" },
};

export default function StatementTab({ vendorId }: StatementTabProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useVendorStatement(vendorId);

  if (isLoading) {
    return (
      <div className="p-5 space-y-3 animate-pulse">
        <div className="h-20 rounded-xl bg-surface-container-highest/60" />
        <div className="h-10 rounded-xl bg-surface-container-highest/40" />
        <div className="h-10 rounded-xl bg-surface-container-highest/40" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="material-symbols-outlined text-[48px] text-error mb-3">error</span>
        <p className="text-sm text-error">{t("vendorStatement.failedToLoad")}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const balance = toNum(data.balance);
  const credit = toNum(data.available_credit);
  const owed = balance > 0;

  return (
    <div className="p-5 space-y-5">
      {/* Balance summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl px-5 py-4">
          <p className="text-[10px] text-outline mb-1">{t("vendorStatement.balance")}</p>
          <p className={`font-data-table text-lg font-bold ${owed ? "text-error" : "text-secondary"}`}>
            {fmtCurrency(balance)}
          </p>
          <p className="text-[10px] text-outline mt-1">
            {owed ? t("vendorStatement.oweVendor") : t("vendorStatement.vendorOwes")}
          </p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl px-5 py-4">
          <p className="text-[10px] text-outline mb-1">{t("vendorStatement.availableCredit")}</p>
          <p className="font-data-table text-lg font-bold text-secondary">{fmtCurrency(credit)}</p>
          <p className="text-[10px] text-outline mt-1">{t("vendorStatement.creditHint")}</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl px-5 py-4">
          <p className="text-[10px] text-outline mb-1">{t("vendorStatement.events")}</p>
          <p className="font-data-table text-lg font-bold text-on-surface">{data.events.length}</p>
          <p className="text-[10px] text-outline mt-1">{t("vendorStatement.timeline")}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-surface-container-high border-b border-outline-variant/50">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">
            {t("vendorStatement.timeline")}
          </h4>
        </div>
        {data.events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <span className="material-symbols-outlined text-[40px] text-outline mb-2">timeline</span>
            <p className="text-sm text-on-surface-variant">{t("vendorStatement.noEvents")}</p>
          </div>
        ) : (
          <div className="p-5 space-y-2">
            {data.events.map((ev, idx) => {
              const meta = EVENT_META[ev.event_type] ?? { icon: "event", tone: "text-outline" };
              const signed = toNum(ev.amount_signed);
              const positive = signed >= 0;
              return (
                <div
                  key={`${ev.entity_id}-${ev.created_at}-${idx}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-variant/40 transition-colors"
                >
                  <span
                    className={`w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 ${meta.tone}`}
                  >
                    <span className="material-symbols-outlined text-base">{meta.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface truncate">
                      {t(`vendorStatement.event.${ev.event_type}`)}
                    </p>
                    <p className="text-[10px] text-outline truncate">
                      {formatDateTime(ev.created_at)}
                      {ev.detail ? ` • ${ev.detail}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-data-table text-xs font-bold ${positive ? "text-error" : "text-secondary"}`}>
                      {positive ? "+" : ""}
                      {fmtCurrency(signed)}
                    </p>
                    <p className="font-data-table text-[10px] text-outline">
                      {t("vendorStatement.balance")}: {fmtCurrency(toNum(ev.running_balance))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtCurrency(v: number): string {
  return formatCurrency(v);
}