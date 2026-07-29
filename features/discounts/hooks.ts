"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discountsApi, promoCodesApi } from "@/features/discounts/api";
import { queryKeys } from "@/lib/query-keys";
import type { DiscountCreate, DiscountUpdate, PromoCodeCreate, PromoCodeUpdate } from "@/features/discounts/types";

export function useDiscounts(params?: { page?: number; size?: number; keyword?: string; sort_by?: string; sort_order?: string }) {
  return useQuery({
    queryKey: queryKeys.discounts.list(params),
    queryFn: () => discountsApi.list(params),
  });
}

export function useDiscount(id: string) {
  return useQuery({
    queryKey: queryKeys.discounts.detail(id),
    queryFn: () => discountsApi.get(id),
    enabled: !!id,
  });
}

export function useDiscountOverview(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: queryKeys.discounts.overview(params),
    queryFn: () => discountsApi.getOverview(params),
  });
}

export function useDiscountProducts(id: string, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: queryKeys.discounts.products(id, params),
    queryFn: () => discountsApi.getProducts(id, params),
    enabled: !!id,
  });
}

export function usePromoCodes(params?: { page?: number; size?: number; keyword?: string }) {
  return useQuery({
    queryKey: queryKeys.promoCodes.list(params),
    queryFn: () => promoCodesApi.list(params),
  });
}

export function usePromoCode(id: string) {
  return useQuery({
    queryKey: queryKeys.promoCodes.detail(id),
    queryFn: () => promoCodesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DiscountCreate) => discountsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DiscountUpdate }) => discountsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useActivateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discountsApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useAssignDiscountProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { product_ids: string[] } }) => discountsApi.assignProducts(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.all });
    },
  });
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PromoCodeCreate) => promoCodesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoCodes.all });
    },
  });
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PromoCodeUpdate }) => promoCodesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoCodes.all });
    },
  });
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promoCodesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoCodes.all });
    },
  });
}

export function useActivatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promoCodesApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promoCodes.all });
    },
  });
}
