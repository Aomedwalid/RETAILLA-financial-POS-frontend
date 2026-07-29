import { api, ApiError } from "@/lib/api";
import type {
  Discount,
  DiscountAnalytics,
  DiscountCreate,
  DiscountUpdate,
  DiscountProductItem,
  PromoCode,
  PromoCodeCreate,
  PromoCodeUpdate,
  PromoValidationResult,
  ProductItem,
  PaginatedResponse,
} from "./types";

function handleError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(500, "Network error");
}

export const discountsApi = {
  list: (params?: { page?: number; size?: number; keyword?: string; sort_by?: string; sort_order?: string }) =>
    api.get<PaginatedResponse<Discount>>(
      "/api/discounts",
      params as Record<string, string | number | boolean | null | undefined>
    ),

  get: (id: string) =>
    api.get<Discount>(`/api/discounts/${id}`),

  create: (body: DiscountCreate) =>
    api.post<Discount>("/api/discounts", body),

  update: (id: string, body: DiscountUpdate) =>
    api.put<Discount>(`/api/discounts/${id}`, body),

  activate: (id: string) =>
    api.patch<Discount>(`/api/discounts/${id}/activate`),

  delete: (id: string) =>
    api.delete<void>(`/api/discounts/${id}`),

  getProducts: (id: string, params?: { page?: number; size?: number }) =>
    api.get<PaginatedResponse<DiscountProductItem>>(
      `/api/discounts/${id}/products`,
      params as Record<string, string | number | boolean | null | undefined>
    ),

  assignProducts: (id: string, body: { product_ids: string[] }) =>
    api.patch<void>(`/api/discounts/${id}/products`, body),

  getOverview: (params?: { start_date?: string; end_date?: string }) =>
    api.get<DiscountAnalytics>(
      "/api/reports/discounts/overview",
      params as Record<string, string | number | boolean | null | undefined>
    ),
};

export const promoCodesApi = {
  list: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<PaginatedResponse<PromoCode>>(
      "/api/promo-codes",
      params as Record<string, string | number | boolean | null | undefined>
    ),

  get: (id: string) =>
    api.get<PromoCode>(`/api/promo-codes/${id}`),

  create: (body: PromoCodeCreate) =>
    api.post<PromoCode>("/api/promo-codes", body),

  update: (id: string, body: PromoCodeUpdate) =>
    api.put<PromoCode>(`/api/promo-codes/${id}`, body),

  activate: (id: string) =>
    api.patch<PromoCode>(`/api/promo-codes/${id}/activate`),

  delete: (id: string) =>
    api.delete<void>(`/api/promo-codes/${id}`),

  validate: (code: string) =>
    api.post<PromoValidationResult>(`/api/promo-codes/validate?code=${encodeURIComponent(code)}`),
};
