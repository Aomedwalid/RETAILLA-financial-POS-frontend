"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { CheckoutResult } from "../types";

interface CheckoutDialogProps {
  result: CheckoutResult;
  onNewSale: () => void;
  onClose: () => void;
}



function buildReceiptHtml(result: CheckoutResult, t: (key: string) => string): string {
  const order = result.order || {};
  const payments = result.payments || [];
  const lineItems = result.line_items || [];

  const cashPayments = payments.filter((p) => p.payment_method === "CASH");
  const cashChange = cashPayments.reduce((sum, p) => sum + parseFloat(p.change_due || "0"), 0);

  const lineRows = lineItems
    .map(
      (item) => `
        <tr>
          <td style="text-align:left;padding:4px 8px;">${item.quantity}x</td>
          <td style="text-align:left;padding:4px 8px;">${t("receipt.item")}</td>
          <td style="text-align:right;padding:4px 8px;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align:right;padding:4px 8px;">${formatCurrency(parseFloat(item.final_price) * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const paymentRows = payments
    .map(
      (p) => `
        <tr>
          <td style="text-align:left;padding:2px 8px;">${p.payment_method === "CASH" ? t("pos.cash") : t("pos.storeCredit")}</td>
          <td style="text-align:right;padding:2px 8px;">${formatCurrency(p.amount)}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t("receipt.title")} — #${(order.id || "").slice(0, 8)}</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          width: 80mm;
          padding: 12px 16px;
        }
        .header { text-align: center; margin-bottom: 12px; }
        .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .header p { font-size: 11px; color: #444; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .divider-solid { border-top: 1px solid #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; padding: 4px 8px; border-bottom: 1px solid #000; }
        td { padding: 4px 8px; }
        .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 6px; }
        .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #444; }
        .info-line { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
        @media print {
          body { width: 100%; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${t("receipt.title")}</h1>
        <p>Order #${(order.id || "").slice(0, 8)}</p>
        <p>${order.created_at ? formatDate(order.created_at) : ""}</p>
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="width:36px">${t("pos.quantity")}</th>
            <th>${t("receipt.item")}</th>
            <th style="text-align:right;width:60px;">${t("pos.price")}</th>
            <th style="text-align:right;width:60px;">${t("common.total")}</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="info-line">
        <span>${t("pos.pricing.subtotal")}</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      ${order.total_discount && parseFloat(order.total_discount) > 0 ? `<div class="info-line"><span>${t("pos.pricing.discount")}</span><span>-${formatCurrency(order.total_discount)}</span></div>` : ""}
      <div class="info-line" style="font-size:13px;font-weight:bold;">
        <span>${t("receipt.total")}</span>
        <span>${formatCurrency(order.total)}</span>
      </div>

      <div class="divider-solid"></div>

      <div style="font-size:11px;">
        <div style="font-weight:bold;margin-bottom:4px;">${t("receipt.payments")}</div>
        <table>
          ${paymentRows}
        </table>
        ${cashChange > 0 ? `<div class="info-line" style="margin-top:4px;"><span>${t("receipt.changeDue")}</span><span>${formatCurrency(cashChange)}</span></div>` : ""}
      </div>

      <div class="divider"></div>

      <div class="footer">
        <p>${t("receipt.thankYou")}</p>
      </div>
    </body>
    </html>`;
}

export default function CheckoutDialog({ result, onNewSale, onClose }: CheckoutDialogProps) {
  const { t } = useTranslation();
  const [showRefund, setShowRefund] = useState(false);
  const order = result.order || {};
  const payments = result.payments || [];
  const lineItems = result.line_items || [];

  const printReceipt = useCallback(() => {
    if (result.receipt_url) {
      window.open(result.receipt_url, "_blank");
      return;
    }
    const html = buildReceiptHtml(result, t);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  }, [result, t]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Success Header */}
        <div className="p-6 bg-secondary/10 border-b border-secondary/30 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[32px] text-secondary">check_circle</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-secondary">{t("common.success")}</h3>
          <p className="text-sm text-on-surface-variant mt-1">{t("pos.orderId")} #{order.id?.slice(0, 8)}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          {/* Order Info */}
          <section>
            <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("pos.orderDetails")}</h4>
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 grid grid-cols-2 gap-4">
              <Info label={t("pos.orderId")} value={(order.id || "").slice(0, 8) + "..."} />
              <Info label={t("pos.orderStatus")} value={order.status || "—"} />
               {order.promo_code && <Info label={t("pos.promoCode")} value={order.promo_code} />}
              <Info label={t("pos.total")} value={formatCurrency(order.total)} mono />
              {order.total_discount && <Info label={t("pos.discountApplied")} value={formatCurrency(order.total_discount)} mono />}
              <Info label={t("pos.change")} value={formatCurrency(result.change_due)} mono />
            </div>
          </section>

          {/* Payments */}
          {payments.length > 0 && (
            <section>
              <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("pos.paymentMethod")} ({payments.length})</h4>
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div key={p.id || idx} className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                        <span className="material-symbols-outlined text-sm text-primary">{p.payment_method === "CASH" ? "payments" : "confirmation_number"}</span>
                        {p.payment_method === "CASH" ? t("pos.cash") : t("pos.storeCredit")}
                      </span>
                      <span className="font-data-table text-sm text-primary">{formatCurrency(p.amount)}</span>
                    </div>
                    {p.payment_method === "CASH" && parseFloat(p.change_due) > 0 && (
                      <p className="text-[11px] text-on-surface-variant font-data-table">{t("pos.change")}: {formatCurrency(p.change_due)}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Line Items */}
          {lineItems.length > 0 && (
            <section>
              <h4 className="text-label-caps font-label-caps text-primary mb-3">{t("pos.items")} ({lineItems.length})</h4>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="bg-surface-container-low rounded-lg border border-outline-variant px-4 py-3">
                    <div className="grid grid-cols-5 gap-2 text-center text-[12px]">
                      <div><p className="text-outline mb-0.5">{t("pos.quantity")}</p><p className="font-data-table text-on-surface">{item.quantity}</p></div>
                      <div><p className="text-outline mb-0.5">{t("pos.price")}</p><p className="font-data-table text-on-surface">{formatCurrency(item.unit_price)}</p></div>
                      <div><p className="text-outline mb-0.5">{t("pos.discount")}</p><p className="font-data-table text-error">{formatCurrency(item.product_discount)}</p></div>
                      <div><p className="text-outline mb-0.5">{t("pos.promoCode")}</p><p className="font-data-table text-error">{formatCurrency(item.promo_discount)}</p></div>
                      <div><p className="text-outline mb-0.5">{t("pos.grandTotal")}</p><p className="font-data-table text-primary">{formatCurrency(item.final_price)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Refund placeholder */}
          {showRefund && (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 text-center animate-fade-in">
              <span className="material-symbols-outlined text-[32px] text-outline mb-2">construction</span>
              <p className="text-sm text-on-surface-variant">{t("pos.refund")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex gap-3">
          <button onClick={() => setShowRefund((v) => !v)} className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors text-sm">
            {showRefund ? t("common.close") : t("pos.refund")}
          </button>
          <div className="flex-1" />
          <button onClick={printReceipt} className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">receipt</span>
            {t("receipt.title")}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors text-sm">
            {t("pos.orderDetails")}
          </button>
          <button onClick={onNewSale} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform text-sm">
            {t("pos.newSale")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-outline mb-0.5">{label}</p>
      <p className={`text-sm text-on-surface ${mono ? "font-data-table" : ""}`}>{value || "—"}</p>
    </div>
  );
}
