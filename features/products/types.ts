export type AttributeValue = string | number | boolean;

export interface VariantResponse {
  id: string;
  attributes: Record<string, AttributeValue>;
  stock_quantity: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  cost: number | null;
  sell_count: number;
  stock_quantity: number;
  low_stock_threshold: number;
  internal_notes: string | null;
  category_id: string | null;
  discount_id: string | null;
  variants_enabled: boolean | null;
  resolved_variants_enabled: boolean;
  created_at: string;
  updated_at: string;
  variants: VariantResponse[];
  actual_price: number;
  is_low_stock: boolean;
  category_name: string | null;
  discount_name: string | null;
  discount_type: string | null;
  discount_percent: number | null;
}

export interface ProductsOverview {
  total_products: number;
  active_products: number;
  inactive_products: number;
  in_stock_products: number;
  out_of_stock_products: number;
  low_stock_products: number;
  total_units_in_stock: number;
  inventory_cost: string;
  inventory_retail_value: string;
  expected_gross_profit: string;
  expected_profit_margin: number;
  average_product_cost: string;
  average_product_price: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_count: number;
  total_stock: number;
  average_price: number;
}

export interface Discount {
  id: string;
  name: string;
  type: "PERCENTAGE" | "PRICE";
  value: number;
}

export interface ProductHistoryItem {
  id: string;
  editor_email: string;
  status: string;
  edited_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  cost: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  description?: string;
  internal_notes?: string;
  category_id?: string;
  discount_id?: string;
  variants_enabled?: boolean;
  variants?: VariantCreate[];
}

export interface VariantCreate {
  attributes: Record<string, AttributeValue>;
  stock_quantity?: number;
}

export interface VariantUpdate {
  id?: string;
  attributes?: Record<string, AttributeValue>;
  stock_quantity?: number;
}

export interface ProductUpdateBody {
  name?: string;
  price?: number;
  cost?: number;
  description?: string;
  internal_notes?: string;
  category_id?: string;
  discount_id?: string;
  variants_enabled?: boolean;
  variants?: VariantUpdate[];
}

export interface StockAdjust {
  variant_id?: string;
  attributes?: Record<string, AttributeValue>;
  operation: "ADD" | "SUBTRACT";
  quantity: number;
}

export interface ProductFiltersState {
  category_id: string;
  in_stock: string;
  low_stock: string;
  keyword: string;
}
