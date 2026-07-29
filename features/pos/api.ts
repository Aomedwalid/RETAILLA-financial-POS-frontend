import { api, ApiError } from "@/lib/api";
import type {
  Cart,
  CheckoutPayload,
  CheckoutResult,
  Customer,
  POSProduct,
  PaginatedResponse,
} from "./types";

function handleError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(500, "Network error");
}

export const posApi = {
  getCart: () =>
    api.get<Cart>("/api/cart"),

  updateCartItem: (variantId: string, quantity: number) =>
    api.post<Cart>("/api/cart/items", { variant_id: variantId, quantity }),

  removeCartItem: (variantId: string) =>
    api.delete<Cart>(`/api/cart/items/${variantId}`),

  applyPromo: (code: string) =>
    api.post<Cart>("/api/cart/promo", { code }),

  removePromo: () =>
    api.delete<Cart>("/api/cart/promo"),

  checkout: (body: CheckoutPayload) =>
    api.post<CheckoutResult>("/api/orders/checkout", body),

  searchProducts: (params: { keyword: string; page?: number; size?: number; sort_by?: string; sort_order?: string }) =>
    api.get<PaginatedResponse<POSProduct>>("/api/products/search", params as Record<string, string | number | boolean | null | undefined>),

  listProducts: (params?: { page?: number; size?: number; category_id?: string; sort_by?: string; sort_order?: string }) =>
    api.get<PaginatedResponse<POSProduct>>("/api/products", params as Record<string, string | number | boolean | null | undefined>),

  getCategories: async () => {
    const result = await api.get<unknown>("/api/categories");
    if (Array.isArray(result)) return result as { id: string; name: string }[];
    if (result && typeof result === "object") {
      const found = Object.values(result as Record<string, unknown>).find(Array.isArray);
      if (found) return found as { id: string; name: string }[];
    }
    return [];
  },

  searchCustomers: async (keyword: string) => {
    const result = await api.get<unknown>("/api/customers/search", { keyword });
    if (Array.isArray(result)) return result as Customer[];
    if (result && typeof result === "object") {
      const found = Object.values(result as Record<string, unknown>).find(Array.isArray);
      if (found) return found as Customer[];
    }
    return [];
  },

  getStoreCreditBalance: (customerId: string) =>
    api.get<{ balance: string }>(`/api/customers/${customerId}/store-credit/balance`),
};
