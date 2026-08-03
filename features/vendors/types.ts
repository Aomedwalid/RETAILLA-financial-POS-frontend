// ─── Core entities (snake_case, aligned with backend schemas) ───────────────
import { formatCurrency } from "@/lib/format";

export const fmt = formatCurrency;

export interface VendorResponse {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms_days: number | null;
  active: boolean;
  outstanding_balance: string | null;
  last_purchase_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorRequest {
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms_days?: number;
}

export type PurchaseOrderStatus = "PENDING" | "RECEIVED";

export interface POLineResponse {
  id: string;
  po_id: string;
  variant_id: string;
  quantity: number;
  unit_cost: string;
  created_at: string;
}

export interface PurchaseOrderResponse {
  id: string;
  tenant_id: string;
  vendor_id: string;
  status: PurchaseOrderStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines: POLineResponse[];
}

export type PaymentMethod = "CASH" | "DIGITAL" | "STORE_CREDIT";
export type PaymentChannel = "CASH" | "INSTAPAY" | "VODAFONE_CASH" | "OTHER";

export type BillStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";
export type BillStatusDisplay = BillStatus | "OVERDUE";

export interface CreateBillRequest {
  bill_reference?: string;
  amount: number;
  return_amount?: number;
  due_date?: string;
  notes?: string;
}

export interface BillResponse {
  id: string;
  tenant_id: string;
  vendor_id: string;
  po_id: string | null;
  bill_reference: string | null;
  amount: string;
  return_amount: string | null;
  net_amount: string | null;
  amount_paid: string | null;
  amount_remaining: string | null;
  due_date: string | null;
  status: BillStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayBillRequest {
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  channel?: PaymentChannel;
}

export interface VendorPayment {
  id: string;
  tenant_id?: string;
  vendor_bill_id: string;
  amount: number | string;
  payment_method: PaymentMethod;
  channel: PaymentChannel | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface VendorBillPaymentResponse {
  payment: VendorPayment;
  bill: BillResponse;
}

export interface VendorOverview {
  vendor_id: string;
  vendor_name: string;
  total_spent: number | string;
  total_outstanding: number | string;
  total_bills: number;
  average_bill_amount: number | string | null;
  recent_bills: BillResponse[];
}

export interface OutstandingBill extends BillResponse {
  vendor_name: string;
}

// ─── Returns / Credits / Statement ──────────────────────────────────────────

export interface VendorReturnLineRequest {
  variant_id: string;
  quantity: number;
  unit_amount: number;
}

export interface VendorReturnRequest {
  lines: VendorReturnLineRequest[];
  cash_refund_amount?: number;
  channel?: PaymentChannel;
  notes?: string;
}

export interface VendorCredit {
  amount: number | string;
  remaining: number | string;
}

export interface VendorReturnResponse {
  return_id: string;
  bill: BillResponse;
  credit: null | {
    id: string;
    amount: number | string;
    remaining: number | string;
  };
  lines: Array<Record<string, unknown>>;
  returned_total: number | string;
  cash_refunded_amount: number | string | null;
}

export type StatementEventType = "PURCHASE_ORDER" | "BILL" | "RETURN" | "PAYMENT";

export interface VendorStatementEvent {
  event_type: StatementEventType;
  entity_id: string;
  created_at: string;
  amount: number | string;
  amount_signed: number | string;
  detail: string | null;
  running_balance: number | string;
}

export interface VendorStatement {
  vendor_id: string;
  vendor_name: string;
  balance: number | string;
  available_credit: number | string;
  events: VendorStatementEvent[];
}

// ─── Ledger import (حساب جاري) ──────────────────────────────────────────────

export interface LedgerImportPayment {
  amount: number;
  payment_date: string;
  channel_note?: string;
}

export interface LedgerPaymentRecord {
  invoice_ref: string;
  invoice_amount: number;
  return_amount: number;
  payments: LedgerImportPayment[];
}

export interface LedgerImportRequest {
  records: LedgerPaymentRecord[];
  notes?: string;
}

// Type returned from the (not-live) ledger import endpoint. No invented response
// model; the submit is confirmed from the request payload, endpoint may 404.
export type LedgerImportResponse = void;

// ─── Shared helpers ─────────────────────────────────────────────────────────

export function billNet(bill: BillResponse): number {
  const raw = bill.net_amount ?? bill.amount;
  const n = parseFloat(String(raw));
  return isNaN(n) ? 0 : n;
}

export function toNum(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

// ─── Receipt Ingestion Types (kept from legacy feature) ─────────────────────

export interface ExtractedReceiptVariant {
  attributes: Record<string, string>;
  quantity: number;
  unit_cost: number;
  price?: number;
}

export interface ExtractedReceiptLine {
  raw_name: string;
  product_name: string;
  is_variant_group: boolean;
  matched_product_id: string | null;
  is_new_product: boolean;
  variants: ExtractedReceiptVariant[];
  price: number;
  cost: number;
}

export interface ConfirmedReceiptVariant {
  attributes: Record<string, string>;
  quantity: number;
}

export interface ConfirmedReceiptLine {
  raw_name: string;
  product_name: string;
  is_variant_group: boolean;
  matched_product_id: string | null;
  variants: ConfirmedReceiptVariant[];
  price: number;
  cost: number;
  description: string;
  category_id: string | null;
  discount_id: string | null;
  low_stock_threshold: number;
  internal_notes: string;
}

export interface ProcessReceiptResponse {
  source: "image" | "excel";
  total_cost: string;
  extraction_notes: string | null;
  lines: ExtractedReceiptLine[];
}

export interface ReceiptConfirmRequest {
  lines: ConfirmedReceiptLine[];
  bill_reference: string | null;
  due_date: string | null;
  notes: string | null;
}

export interface ConfirmReceiptResponse {
  purchase_order: PurchaseOrderResponse;
  bill: BillResponse;
  new_products_created: number;
  message: string;
}

export type ReceiptIngestionStep = "upload" | "review" | "confirmed";

export interface PendingReceiptState {
  vendorId: string;
  vendorName: string;
  source: "image" | "excel" | "manual" | null;
  lines: ReviewLineState[];
  totalCost: number;
  extractionNotes: string | null;
  billReference: string;
  dueDate: string;
  notes: string;
  newProductsCount: number;
}

export interface ReviewVariantState {
  attributes: Record<string, string>;
  quantity: number;
}

export interface ReviewLineState {
  raw_name: string;
  product_name: string;
  is_variant_group: boolean;
  matched_product_id: string | null;
  is_new_product: boolean;
  variants: ReviewVariantState[];
  price: string;
  cost: string;
  description: string;
  category_id: string;
  discount_id: string;
  low_stock_threshold: string;
  internal_notes: string;
}

export interface ReceiptState {
  step: ReceiptIngestionStep;
  source: "image" | "excel" | null;
  lines: ReviewLineState[];
  total_cost: string;
  extraction_notes: string | null;
  bill_reference: string;
  due_date: string;
  notes: string;
  new_products_count: number;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;
export const ACCEPTED_MIME_TYPES = ACCEPTED_TYPES as readonly string[];
export const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.xlsx,.xls";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB