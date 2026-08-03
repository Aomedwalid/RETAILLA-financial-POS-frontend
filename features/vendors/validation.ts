import type { LedgerPaymentRecord } from "./types";

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export interface ReturnLineInput {
  variant_id: string;
  quantity: string | number;
  unit_amount: string | number;
}

/** Validates a single vendor return request before submitting. */
export function validateVendorReturn(
  lines: ReturnLineInput[],
  cashRefund: string,
  returnedTotal: number,
  maxCreditRefundable: number,
  t: TFunction
): string | null {
  if (lines.length === 0) return t("vendorReturn.noLines");
  for (const [i, line] of lines.entries()) {
    if (!line.variant_id) return t("vendorReturn.missingVariant", { index: i + 1 });
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty < 1) return t("vendorReturn.badQuantity", { index: i + 1 });
    const unit = Number(line.unit_amount);
    if (!Number.isFinite(unit) || unit < 0) return t("vendorReturn.badAmount", { index: i + 1 });
  }
  const cash = Number(cashRefund);
  if (!Number.isNaN(cash) && cash > 0) {
    if (cash > returnedTotal) return t("vendorReturn.cashTooHigh");
    if (cash > maxCreditRefundable) return t("vendorReturn.noRefundableCredit");
  }
  return null;
}

/** Validates ledger import records before submitting. */
export function validateLedgerImport(
  records: LedgerPaymentRecord[],
  t: TFunction
): string | null {
  if (records.length === 0) return t("ledgerImport.noRecords");
  for (const [i, r] of records.entries()) {
    if (!r.invoice_ref.trim()) return t("ledgerImport.missingRef", { index: i + 1 });
    if (!Number.isFinite(r.invoice_amount) || r.invoice_amount <= 0)
      return t("ledgerImport.badInvoice", { index: i + 1 });
    if (!Number.isFinite(r.return_amount) || r.return_amount < 0)
      return t("ledgerImport.badReturn", { index: i + 1 });
    if (r.return_amount > r.invoice_amount)
      return t("ledgerImport.returnExceeds", { index: i + 1 });
    if (!Array.isArray(r.payments)) return t("ledgerImport.badPayments", { index: i + 1 });
    for (const p of r.payments) {
      if (!Number.isFinite(p.amount) || p.amount <= 0)
        return t("ledgerImport.badPayment", { index: i + 1 });
      if (!p.payment_date) return t("ledgerImport.missingDate", { index: i + 1 });
    }
  }
  return null;
}

export type { LedgerPaymentRecord };