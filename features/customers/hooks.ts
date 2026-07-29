"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/features/customers/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateCustomerPayload, UpdateCustomerPayload, DebtAdjustmentPayload, RedeemPointsPayload } from "@/features/customers/types";

export function useCustomers(params: {
  page: number;
  keyword: string;
  active: string;
  sortBy: string;
  sortOrder: string;
  size?: number;
}) {
  const size = params.size ?? 10;

  return useQuery({
    queryKey: queryKeys.customers.list({ page: params.page, keyword: params.keyword, active: params.active, sort_by: params.sortBy, sort_order: params.sortOrder }),
    queryFn: async () => {
      const sortParams = { sort_by: params.sortBy, sort_order: params.sortOrder };
      if (params.keyword) {
        return customersApi.search({ keyword: params.keyword, page: params.page, size, ...sortParams });
      }
      const apiParams: Record<string, string | number | boolean | undefined> = { page: params.page, size, ...sortParams };
      if (params.active === "true" || params.active === "false") apiParams.active = params.active === "true";
      return customersApi.list(apiParams as Parameters<typeof customersApi.list>[0]);
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCustomerPurchases(id: string, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: queryKeys.customers.purchases(id, params),
    queryFn: () => customersApi.getPurchases(id, params),
    enabled: !!id,
  });
}

export function useCustomerPointsLedger(id: string, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: queryKeys.customers.pointsLedger(id, params),
    queryFn: () => customersApi.getPointsLedger(id, params),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerPayload) => customersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCustomerPayload }) => customersApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useAdjustDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DebtAdjustmentPayload }) => customersApi.adjustDebt(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RedeemPointsPayload }) => customersApi.redeemPoints(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
