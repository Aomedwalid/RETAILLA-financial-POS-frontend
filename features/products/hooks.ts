"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, categoriesApi } from "@/features/products/api";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse, ProductResponse, Category, CreateProductPayload, ProductUpdateBody, StockAdjust } from "@/features/products/types";

export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: () => productsApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(params: {
  page: number;
  keyword: string;
  categoryId: string;
  lowStock: string;
  sortBy: string;
  sortOrder: string;
  size?: number;
}) {
  const size = params.size ?? 10;

  return useQuery({
    queryKey: queryKeys.products.list({ page: params.page, keyword: params.keyword, category_id: params.categoryId, low_stock: params.lowStock, sort_by: params.sortBy, sort_order: params.sortOrder }),
    queryFn: async () => {
      const sortParams = { sort_by: params.sortBy, sort_order: params.sortOrder };
      if (params.keyword) {
        return productsApi.search({ keyword: params.keyword, page: params.page, size, ...sortParams });
      }
      const apiParams: Record<string, string | number | boolean | undefined> = { page: params.page, size, ...sortParams };
      if (params.categoryId) apiParams.category_id = params.categoryId;
      if (params.lowStock === "true") apiParams.low_stock = true;
      return productsApi.list(apiParams as Parameters<typeof productsApi.list>[0]);
    },
  });
}

export function useCategories(params: { page: number; size?: number }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.products.categories(), "list", params],
    queryFn: () => categoriesApi.list({ page: params.page, size: params.size ?? 10 }),
    enabled: options?.enabled,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductPayload) => productsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProductUpdateBody }) => productsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StockAdjust }) => productsApi.adjustStock(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; active?: boolean }) => categoriesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; description?: string; sort_order?: number; active?: boolean } }) => categoriesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.categories() });
    },
  });
}

export function useToggleCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.categories() });
    },
  });
}
