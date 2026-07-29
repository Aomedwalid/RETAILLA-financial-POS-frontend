export type AttributeValue = string | number | boolean;

export interface POSProductVariant {
  id: string;
  attributes: Record<string, AttributeValue>;
  stock_quantity: number;
}

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  actual_price: number;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock?: boolean;
  category_name?: string;
  variants_enabled?: boolean | null;
  resolved_variants_enabled?: boolean;
  variants?: POSProductVariant[];
}

export interface PricingLine {
  variant_id: string;
  product_id: string;
  quantity: number;
  original_price: string;
  product_discount_reduction: string;
  promo_reduction: string;
  final_price: string;
}

export interface PricingResult {
  lines: PricingLine[];
  subtotal: string;
  total_product_discount: string;
  total_promo_discount: string;
  grand_total: string;
}

export interface ManualDiscountInfo {
  type: "PERCENTAGE" | "FIXED" | null;
  value: number | null;
  amount: number;
  reason: string | null;
  approved_by: string | null;
}

export interface TenantSettings {
  manual_discount_enabled: boolean;
  max_discount_percent: number;
  max_discount_amount: number;
  manager_approval_threshold: number;
  manager_approval_percent: number;
  reason_required: boolean;
  reason_options: string[];
}

export interface Cart {
  id: string;
  user_id: string;
  promo_code: string | null;
  status: string;
  pricing: PricingResult;
  manual_discount_type: "PERCENTAGE" | "FIXED" | null;
  manual_discount_value: number | null;
  manual_discount_amount: number;
  manual_discount_reason: string | null;
  manual_discount_approved_by: string | null;
  store_credit_balance: number | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  attributes: Record<string, AttributeValue>;
  quantity: number;
  unit_price: string;
  line_total: string;
  stock_quantity: number;
}

export interface PaymentAllocation {
  method: "CASH" | "CARD" | "STORE_CREDIT";
  amount: number;
}

export interface CheckoutPayload {
  cart_id: string;
  cash_amount: string;
  store_credit_amount: string;
  customer_id?: string;
  manual_discount_type?: "PERCENTAGE" | "FIXED" | null;
  manual_discount_value?: number | null;
  manual_discount_reason?: string | null;
}

export interface CheckoutLineItem {
  id?: string;
  order_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price: string;
  product_discount: string;
  promo_discount: string;
  final_price: string;
}

export interface CheckoutPayment {
  id: string;
  order_id: string;
  tenant_id?: string;
  payment_method: string;
  amount: string;
  change_due: string;
  created_at: string;
}

export interface CheckoutOrder {
  id: string;
  tenant_id?: string;
  user_id?: string;
  location_id?: string;
  customer_id?: string;
  status: string;
  promo_code?: string | null;
  subtotal?: string;
  total_discount?: string;
  total: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckoutResultManualDiscount {
  type: "PERCENTAGE" | "FIXED";
  value: number;
  amount: number;
  reason: string;
  approved_by: string | null;
}

export interface CheckoutResult {
  id?: string;
  order: CheckoutOrder;
  line_items: CheckoutLineItem[];
  change_due: string;
  payments: CheckoutPayment[];
  receipt_url?: string;
  manual_discount?: CheckoutResultManualDiscount | null;
  store_credit_issued?: number;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
