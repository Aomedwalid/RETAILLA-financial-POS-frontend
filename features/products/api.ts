import { api } from "@/lib/api";
import type {
  ProductResponse,
  Category,
  Discount,
  ProductHistoryItem,
  PaginatedResponse,
  CreateProductPayload,
  ProductUpdateBody,
  StockAdjust,
  ProductsOverview,
} from "./types";

export const productsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<PaginatedResponse<ProductResponse>>("/api/products", params as Record<string, string>),

  search: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<ProductResponse>>("/api/products/search", params as Record<string, string>),

  getOverview: () =>
    api.get<ProductsOverview>("/api/products/overview"),

  get: (id: string) =>
    api.get<ProductResponse>(`/api/products/${id}`),

  create: (body: CreateProductPayload) =>
    api.post<ProductResponse>("/api/products", body),

  update: (id: string, body: ProductUpdateBody) =>
    api.put<ProductResponse>(`/api/products/${id}`, body),

  adjustStock: (id: string, body: StockAdjust) =>
    api.patch<ProductResponse>(`/api/products/${id}/stock`, body),

  delete: (id: string) =>
    api.delete(`/api/products/${id}`),

  getCategories: async (activeOnly = true) => {
    const params: Record<string, string | number | boolean> = { active: activeOnly, size: 100 };
    const result = await api.get<PaginatedResponse<Category>>("/api/categories/", params as unknown as Record<string, string>);
    return result.items;
  },

  getDiscounts: async () => {
    const result = await api.get<Discount[] | { items: Discount[]; total?: number }>("/api/discounts");
    if (Array.isArray(result)) return result;
    return result.items ?? [];
  },

  getHistory: (productId: string, params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<ProductHistoryItem>>(`/api/products/${productId}/history`, params as Record<string, string>),
};

export const categoriesApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<PaginatedResponse<Category>>("/api/categories/", params as Record<string, string>),

  get: (id: string) =>
    api.get<Category>(`/api/categories/${id}`),

  search: (params: { keyword: string; page?: number; size?: number }) =>
    api.get<PaginatedResponse<Category>>("/api/categories/search", params as unknown as Record<string, string>),

  top: () =>
    api.get<Category[]>("/api/categories/top"),

  create: (body: { name: string; description?: string; active?: boolean }) =>
    api.post<Category>("/api/categories/", body),

  update: (id: string, body: { name?: string; description?: string; sort_order?: number; active?: boolean }) =>
    api.put<Category>(`/api/categories/${id}`, body),

  reorder: (id: string, sort_order: number) =>
    api.patch<Category>(`/api/categories/${id}/order`, { sort_order }),

  toggle: (id: string) =>
    api.patch<Category>(`/api/categories/${id}/toggle`),

  delete: (id: string) =>
    api.delete(`/api/categories/${id}`),
};
