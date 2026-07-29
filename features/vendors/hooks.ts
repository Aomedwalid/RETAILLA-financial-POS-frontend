"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "@/features/vendors/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateVendorRequest, PayBillRequest, ReceiptConfirmRequest } from "@/features/vendors/types";

export function useVendors() {
  return useQuery({
    queryKey: queryKeys.vendors.list(),
    queryFn: () => vendorsApi.list(),
    staleTime: 30_000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => vendorsApi.get(id),
    enabled: !!id,
  });
}

export function useVendorOverview(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.overview(vendorId),
    queryFn: () => vendorsApi.getOverview(vendorId),
    enabled: !!vendorId,
  });
}

export function useVendorPurchaseOrders(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.purchaseOrders(vendorId),
    queryFn: () => vendorsApi.listPOs(vendorId),
    enabled: !!vendorId,
  });
}

export function useVendorBills(vendorId: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.vendors.bills(vendorId, status),
    queryFn: () => vendorsApi.listVendorBills(vendorId, status),
    enabled: !!vendorId,
  });
}

export function useOutstandingBills() {
  return useQuery({
    queryKey: queryKeys.vendors.outstandingBills(),
    queryFn: () => vendorsApi.listOutstandingBills(),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVendorRequest) => vendorsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

export function useDeactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => vendorsApi.deactivate(vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, poId, body }: { vendorId: string; poId: string; body: { amount: number; due_date?: string; notes?: string } }) =>
      vendorsApi.createBill(vendorId, poId, body as Parameters<typeof vendorsApi.createBill>[2]),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.bills(vendorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, billId, body }: { vendorId: string; billId: string; body: PayBillRequest }) =>
      vendorsApi.payBill(vendorId, billId, body),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.bills(vendorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useReceivePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, poId }: { vendorId: string; poId: string }) => vendorsApi.receivePO(vendorId, poId),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.purchaseOrders(vendorId) });
    },
  });
}

export function useProcessReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, file }: { vendorId: string; file: File }) => vendorsApi.processReceipt(vendorId, file),
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, body }: { vendorId: string; body: ReceiptConfirmRequest }) => vendorsApi.confirmReceipt(vendorId, body),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}
