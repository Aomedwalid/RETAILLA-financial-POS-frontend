export interface LineItemRefund {
  id: string;
  order_line_item_id: string;
  quantity: number;
  refund_amount: string;
  reason: string | null;
  created_at: string;
}

export interface OrderLineItem {
  id: string;
  order_id?: string;
  product_id?: string;
  variant_id?: string;
  product_name?: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  unit_price: string;
  product_discount: string;
  promo_discount: string;
  final_price: string;
  refunded_quantity: number | null;
  refunded_amount: string | null;
  net_price: string | null;
  refunds: LineItemRefund[] | null;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  tenant_id?: string;
  payment_method: string;
  amount: string;
  change_due: string;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id?: string;
  user_id?: string;
  location_id?: string;
  customer_id?: string | null;
  status: string;
  promo_code?: string | null;
  subtotal?: string;
  total_discount?: string;
  total: string;
  created_at: string;
  updated_at?: string;
  line_items?: OrderLineItem[];
  payments?: OrderPayment[];
}

export interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface OrdersSummary {
  total_orders: number;
  completed_orders: number;
  refunded_orders: number;
  partially_refunded_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_sales: string;
  total_refunded: string;
  net_sales: string;
  average_order_value: string;
}

export interface OrdersOverviewData {
  summary: OrdersSummary;
  orders: Order[];
}

export interface RefundLineRequest {
  order_line_item_id: string;
  quantity: number;
  reason?: string;
}

export interface RefundRequest {
  order_id: string;
  lines: RefundLineRequest[];
}

export interface RefundRecord {
  id: string;
  order_line_item_id: string;
  quantity: number;
  refund_amount: string;
  reason: string | null;
  created_at: string;
}

export interface RefundResponse {
  refunds: RefundRecord[];
}
