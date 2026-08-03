"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "@/features/vendors/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateVendorRequest,
  PayBillRequest,
  ReceiptConfirmRequest,
  VendorReturnRequest,
  LedgerImportRequest,
  BillResponse,
} from "@/features/vendors/types";

// Shared invalidation helpers (called from mutation onSuccess).
function invalidateVendorTracked(queryClient: ReturnType<typeof useQueryClient>, vendorId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.vendors.overview(vendorId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.vendors.statement(vendorId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.vendors.bills(vendorId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.vendors.outstandingBills() });
}

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

export function useVendorStatement(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.statement(vendorId),
    queryFn: () => vendorsApi.getStatement(vendorId),
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
    mutationFn: ({
      vendorId,
      poId,
      body,
    }: {
      vendorId: string;
      poId: string;
      body: Parameters<typeof vendorsApi.createBill>[2];
    }) => vendorsApi.createBill(vendorId, poId, body),
    onSuccess: (_, { vendorId }) => {
      invalidateVendorTracked(queryClient, vendorId);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.purchaseOrders(vendorId) });
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      billId,
      body,
    }: {
      vendorId: string;
      billId: string;
      body: PayBillRequest;
    }) => vendorsApi.payBill(vendorId, billId, body),
    onSuccess: (_, { vendorId }) => {
      invalidateVendorTracked(queryClient, vendorId);
    },
  });
}

export function useReceivePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, poId }: { vendorId: string; poId: string }) =>
      vendorsApi.receivePO(vendorId, poId),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.purchaseOrders(vendorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useCreateVendorReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      billId,
      body,
    }: {
      vendorId: string;
      billId: string;
      body: VendorReturnRequest;
    }) => vendorsApi.createVendorReturn(vendorId, billId, body),
    onSuccess: (_, { vendorId }) => {
      invalidateVendorTracked(queryClient, vendorId);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.purchaseOrders(vendorId) });
    },
  });
}

export function useLedgerImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, body }: { vendorId: string; body: LedgerImportRequest }) =>
      vendorsApi.ledgerImport(vendorId, body),
    onSuccess: (_, { vendorId }) => {
      invalidateVendorTracked(queryClient, vendorId);
    },
  });
}

export function useProcessReceipt() {
  return useMutation({
    mutationFn: ({ vendorId, file }: { vendorId: string; file: File }) =>
      vendorsApi.processReceipt(vendorId, file),
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      body,
      manual,
    }: {
      vendorId: string;
      body: ReceiptConfirmRequest;
      manual?: boolean;
    }) =>
      manual
        ? vendorsApi.manualReceipt(vendorId, body)
        : vendorsApi.confirmReceipt(vendorId, body),
    onSuccess: (_, { vendorId }) => {
      invalidateVendorTracked(queryClient, vendorId);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.purchaseOrders(vendorId) });
    },
  });
}

export type { BillResponse };