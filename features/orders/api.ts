import { api, ApiError } from "@/lib/api";
import type { Order, OrdersResponse, OrdersOverviewData, RefundRequest, RefundResponse } from "./types";

export const ordersApi = {
  list: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<OrdersResponse>("/api/orders", params),

  get: (orderId: string) =>
    api.get<Order>(`/api/orders/${orderId}`),

  getOverview: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<OrdersOverviewData>("/api/orders/overview", params),

  createRefund: (orderId: string, body: RefundRequest) =>
    api.post<RefundResponse>(`/api/orders/${orderId}/refunds`, body),
};
