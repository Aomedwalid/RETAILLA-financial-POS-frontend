import { api, ApiError } from "@/lib/api";
import type {
  CustomerListItem,
  CustomerDetails,
  CustomerPurchase,
  PointsLedgerEntry,
  PaginatedResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  DebtAdjustmentPayload,
  RedeemPointsPayload,
} from "./types";

function handleError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw new ApiError(500, "Network error");
}

export const customersApi = {
  list: (params?: { page?: number; size?: number; active?: boolean; sort_by?: string; sort_order?: string }) =>
    api.get<PaginatedResponse<CustomerListItem>>("/api/customers", params as Record<string, string | number | boolean | null | undefined>),

  search: (params: { keyword: string; page?: number; size?: number; sort_by?: string; sort_order?: string }) =>
    api.get<PaginatedResponse<CustomerListItem>>("/api/customers/search", params as Record<string, string | number | boolean | null | undefined>),

  get: (id: string) =>
    api.get<CustomerDetails>(`/api/customers/${id}`),

  create: (body: CreateCustomerPayload) =>
    api.post<CustomerListItem>("/api/customers", body),

  update: (id: string, body: UpdateCustomerPayload) =>
    api.put<CustomerListItem>(`/api/customers/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/customers/${id}`),

  adjustDebt: (id: string, body: DebtAdjustmentPayload) =>
    api.patch<CustomerDetails>(`/api/customers/${id}/debt`, body),

  redeemPoints: (id: string, body: RedeemPointsPayload) =>
    api.post<CustomerDetails>(`/api/customers/${id}/points/redeem`, body),

  getPurchases: (id: string, params?: { page?: number; size?: number }) =>
    api.get<PaginatedResponse<CustomerPurchase>>(`/api/customers/${id}/purchases`, params as Record<string, string | number | boolean | null | undefined>),

  getPointsLedger: (id: string, params?: { page?: number; size?: number }) =>
    api.get<PaginatedResponse<PointsLedgerEntry>>(`/api/customers/${id}/points/ledger`, params as Record<string, string | number | boolean | null | undefined>),
};
