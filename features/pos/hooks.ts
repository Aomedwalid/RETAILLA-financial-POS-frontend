"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { posApi } from "./api";
import { productsApi } from "@/features/products/api";
import { queryKeys } from "@/lib/query-keys";
import type { Cart, CartItem, POSProduct } from "./types";

function buildVariantLabel(attrs: Record<string, string | number | boolean>): string {
  return Object.values(attrs).filter(Boolean).join(" / ");
}

async function enrichCartItems(cartData: Cart): Promise<CartItem[]> {
  const lines = cartData.pricing.lines;
  if (!lines.length) return [];

  const uniqueProductIds = [...new Set(lines.map((l) => l.product_id))];
  const productMap = new Map<string, { name: string; sku: string; variants: { id: string; attributes: Record<string, string | number | boolean>; stock_quantity: number }[] }>();

  await Promise.all(
    uniqueProductIds.map(async (pid) => {
      try {
        const p = await productsApi.get(pid);
        productMap.set(pid, { name: p.name, sku: p.sku, variants: p.variants });
      } catch {
        productMap.set(pid, { name: "Unknown", sku: "", variants: [] });
      }
    })
  );

  return lines.map((line) => {
    const product = productMap.get(line.product_id);
    const variant = product?.variants.find((v) => v.id === line.variant_id);
    return {
      variant_id: line.variant_id,
      product_id: line.product_id,
      product_name: product?.name ?? "Unknown",
      variant_name: variant ? buildVariantLabel(variant.attributes) : "",
      sku: product?.sku ?? "",
      attributes: variant?.attributes ?? {},
      quantity: line.quantity,
      unit_price: (parseFloat(line.original_price) / line.quantity).toFixed(2),
      line_total: line.final_price,
      stock_quantity: variant?.stock_quantity ?? 0,
    };
  });
}

async function fetchCartAndEnrich(): Promise<{ cart: Cart; items: CartItem[]; scBalance: number }> {
  const cart = await posApi.getCart();
  const items = await enrichCartItems(cart);
  const scBalance = cart.store_credit_balance != null ? cart.store_credit_balance : 0;
  return { cart, items, scBalance };
}

export function usePosProducts() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const size = 10;

  const queryParams = { keyword, page, size, category_id: categoryId, sort_by: sortBy, sort_order: sortOrder };

  const productsQ = useQuery({
    queryKey: queryKeys.pos.products(queryParams),
    queryFn: () => {
      const sortParams = { sort_by: sortBy, sort_order: sortOrder };
      if (keyword) {
        return posApi.searchProducts({ keyword, page, size, ...sortParams });
      }
      const params: Record<string, string | number | boolean | null | undefined> = { page, size, ...sortParams };
      if (categoryId) params.category_id = categoryId;
      return posApi.listProducts(params as { page?: number; size?: number; category_id?: string; sort_by?: string; sort_order?: string });
    },
  });

  const categoriesQ = useQuery({
    queryKey: queryKeys.pos.categories(),
    queryFn: () => posApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((val: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setKeyword(val);
      setPage(1);
    }, 300);
  }, []);

  const handleSortChange = useCallback((val: string) => {
    const [field, order] = val.split("|");
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  return {
    products: productsQ.data?.items ?? [],
    loading: productsQ.isLoading,
    error: productsQ.error ? (productsQ.error instanceof Error ? productsQ.error.message : "Failed to load products") : "",
    page,
    totalPages: productsQ.data?.pages ?? 1,
    totalItems: productsQ.data?.total ?? 0,
    keyword,
    categoryId,
    categories: categoriesQ.data ?? [],
    size,
    sortBy,
    sortOrder,
    setPage,
    setCategoryId,
    search,
    handleSortChange,
    refresh: () => { productsQ.refetch(); categoriesQ.refetch(); },
  };
}

export function useCart() {
  const queryClient = useQueryClient();
  const requestSeqRef = useRef(0);
  const [customerScBalance, setCustomerScBalance] = useState(0);

  const cartQ = useQuery({
    queryKey: queryKeys.pos.cart(),
    queryFn: fetchCartAndEnrich,
    staleTime: 0,
    refetchOnMount: true,
  });

  const invalidateCart = useCallback(() => {
    setCustomerScBalance(0);
    queryClient.invalidateQueries({ queryKey: queryKeys.pos.cart() });
  }, [queryClient]);

  const performCartMutation = useCallback(async <T>(mutationFn: () => Promise<T>): Promise<T> => {
    const seq = ++requestSeqRef.current;
    const result = await mutationFn();
    if (seq !== requestSeqRef.current) return result;
    invalidateCart();
    return result;
  }, [invalidateCart]);

  const addItem = useCallback(async (variantId: string, qty: number) => {
    return performCartMutation(() => posApi.updateCartItem(variantId, qty));
  }, [performCartMutation]);

  const removeItem = useCallback(async (variantId: string) => {
    return performCartMutation(() => posApi.removeCartItem(variantId));
  }, [performCartMutation]);

  const applyPromo = useCallback(async (code: string) => {
    return performCartMutation(() => posApi.applyPromo(code));
  }, [performCartMutation]);

  const removePromo = useCallback(async () => {
    return performCartMutation(() => posApi.removePromo());
  }, [performCartMutation]);

  const updateQuantity = useCallback(async (variantId: string, quantity: number) => {
    return performCartMutation(() => posApi.updateCartItem(variantId, quantity));
  }, [performCartMutation]);

  const clearCart = useCallback(async () => {
    const items = cartQ.data?.items ?? [];
    return performCartMutation(async () => {
      await Promise.all(items.map((item) => posApi.removeCartItem(item.variant_id)));
      return posApi.getCart();
    });
  }, [performCartMutation, cartQ.data?.items]);

  const fetchScBalance = useCallback(async (customerId: string) => {
    try {
      const result = await posApi.getStoreCreditBalance(customerId);
      const balance = parseFloat(result.balance) || 0;
      setCustomerScBalance(balance);
      return balance;
    } catch {
      setCustomerScBalance(0);
      return 0;
    }
  }, []);

  const scBalance = customerScBalance > 0 ? customerScBalance : (cartQ.data?.scBalance ?? 0);

  return {
    cart: cartQ.data?.cart ?? null,
    items: cartQ.data?.items ?? [],
    loading: cartQ.isLoading,
    error: cartQ.error ? (cartQ.error instanceof Error ? cartQ.error.message : "Failed to load cart") : "",
    scBalance,
    refresh: invalidateCart,
    addItem,
    removeItem,
    updateQuantity,
    applyPromo,
    removePromo,
    clearCart,
    fetchScBalance,
  };
}
