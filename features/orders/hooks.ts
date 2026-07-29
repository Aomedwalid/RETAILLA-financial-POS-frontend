"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/features/orders/api";
import { queryKeys } from "@/lib/query-keys";
import type { RefundRequest } from "@/features/orders/types";

export function useOrders(params?: Record<string, string | number | boolean | null | undefined>) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useOrdersOverview(params?: Record<string, string | number | boolean | null | undefined>) {
  return useQuery({
    queryKey: queryKeys.orders.overview(params),
    queryFn: () => ordersApi.getOverview(params),
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: RefundRequest }) => ordersApi.createRefund(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
