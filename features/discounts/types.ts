export type DiscountType = "PERCENTAGE" | "PRICE";

export interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  max_discount_amount: number | null;
  active: boolean;
  times_used: number;
  products_affected: number;
  total_saved: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountCreate {
  name: string;
  type: DiscountType;
  value: number;
  max_discount_amount?: number;
}

export interface DiscountUpdate {
  name?: string;
  type?: DiscountType;
  value?: number;
  max_discount_amount?: number;
  active?: boolean;
}

export interface DiscountProductItem {
  id: string;
  name: string;
  sku: string;
  price: number;
}

export interface PromoCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  max_discount_amount: number | null;
  applies_to_all_products: boolean;
  active: boolean;
  used: boolean;
  times_used: number;
  products_affected: number;
  total_saved: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  applicable_product_ids: string[];
}

export interface PromoCodeCreate {
  type: DiscountType;
  value: number;
  max_discount_amount?: number;
  applies_to_all_products: boolean;
  applicable_product_ids?: string[];
  expires_at?: string;
}

export interface PromoCodeUpdate {
  type?: DiscountType;
  value?: number;
  max_discount_amount?: number;
  applies_to_all_products?: boolean;
  applicable_product_ids?: string[];
  active?: boolean;
  expires_at?: string;
}

export interface PromoValidationResult {
  valid: boolean;
  reason: string | null;
}

export interface ProductItem {
  id: string;
  name: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PromoBreakdownItem {
  promo_id: string;
  code: string;
  type: string;
  value: string;
  max_discount_amount: string | null;
  times_used: number;
  products_affected: number;
  total_saved: string;
}

export interface DiscountBreakdownItem {
  discount_id: string;
  name: string;
  type: string;
  value: string;
  max_discount_amount: string | null;
  times_used: number;
  products_affected: number;
  total_saved: string;
}

export interface DiscountAnalytics {
  total_orders_with_discounts: number;
  total_discount_amount: string;
  total_product_discount_amount: string;
  total_promo_discount_amount: string;
  promo_breakdown: PromoBreakdownItem[];
  discount_breakdown: DiscountBreakdownItem[];
}
