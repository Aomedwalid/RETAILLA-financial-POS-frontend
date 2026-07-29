export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  rank: string;
  total_orders: number;
  total_spent: string;
  loyalty_points: number;
  current_debt: string;
  last_purchase: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerPurchaseLineItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: string;
  product_discount: string;
  promo_discount: string;
  final_price: string;
}

export interface CustomerPurchasePayment {
  id: string;
  order_id: string;
  tenant_id: string;
  payment_method: string;
  amount: string;
  change_due: string;
  created_at: string;
}

export interface CustomerPurchase {
  id: string;
  tenant_id: string;
  user_id: string;
  location_id: string;
  customer_id: string;
  status: string;
  promo_code: string | null;
  subtotal: string;
  total_discount: string;
  total: string;
  created_at: string;
  updated_at: string;
  line_items: CustomerPurchaseLineItem[];
  payments: CustomerPurchasePayment[];
}

export interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  rank: string;
  total_orders: number;
  total_spent: string;
  loyalty_points: number;
  current_debt: string;
  lifetime_points_earned: number;
  subscription_bonus_granted: boolean;
  last_purchase: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointsLedgerEntry {
  id: string;
  points: number;
  redeemed: boolean;
  expiration_date: string | null;
  earned_date: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateCustomerPayload {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateCustomerPayload {
  name: string;
  email?: string;
  phone?: string;
}

export interface DebtAdjustmentPayload {
  operation: "ADD" | "SUBTRACT";
  amount: number;
}

export interface RedeemPointsPayload {
  points: number;
}
