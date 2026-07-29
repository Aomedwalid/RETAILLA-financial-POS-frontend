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

export interface POLineResponse {
  variant_id: string;
  quantity: number;
  unit_cost: string;
}

export interface PurchaseOrderResponse {
  id: string;
  tenant_id: string;
  vendor_id: string;
  status: "PENDING" | "RECEIVED";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines: POLineResponse[];
}

export interface CreateBillRequest {
  bill_reference?: string;
  amount: number;
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
  amount_paid: string | null;
  amount_remaining: string | null;
  due_date: string | null;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayBillRequest {
  amount: number;
  payment_method: string;
  notes?: string;
}

export interface VendorBillPaymentResponse {
  payment: {
    id: string;
    tenant_id: string;
    vendor_bill_id: string;
    amount: number;
    payment_method: string;
    created_by: string;
    notes: string | null;
    created_at: string;
  };
  bill: BillResponse;
}

export interface VendorOverview {
  vendor_id: string;
  vendor_name: string;
  total_spent: number;
  total_outstanding: number;
  total_bills: number;
  average_bill_amount: number;
  recent_bills: BillResponse[];
}

export interface OutstandingBill extends BillResponse {
  vendor_name: string;
}

// ─── Receipt Ingestion Types ───

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
  description: string | null;
  category_id: string | null;
  discount_id: string | null;
  low_stock_threshold: number | null;
  internal_notes: string | null;
}

export interface ProcessReceiptResponse {
  source: "image" | "excel";
  total_cost: string;
  extraction_notes: string | null;
  lines: ExtractedReceiptLine[];
}

export interface ReceiptConfirmRequest {
  lines: ConfirmedReceiptLine[];
  bill_reference: string;
  due_date: string | null;
  notes: string;
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

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"] as const;
export const ACCEPTED_MIME_TYPES = ACCEPTED_TYPES as readonly string[];
export const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.xlsx,.xls";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function fmt(v: string | number | null | undefined): string {
  if (v == null) return "٠٫٠٠ ج.م";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return (isNaN(n) ? 0 : n).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ج.م";
}