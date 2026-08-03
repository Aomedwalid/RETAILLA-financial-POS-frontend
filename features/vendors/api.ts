import { api } from "@/lib/api";
import http from "@/lib/axios";
import type {
  VendorResponse,
  CreateVendorRequest,
  OutstandingBill,
  PurchaseOrderResponse,
  BillResponse,
  CreateBillRequest,
  PayBillRequest,
  VendorBillPaymentResponse,
  VendorOverview,
  ProcessReceiptResponse,
  ReceiptConfirmRequest,
  ConfirmReceiptResponse,
  VendorReturnRequest,
  VendorReturnResponse,
  VendorStatement,
  LedgerImportRequest,
  LedgerImportResponse,
} from "./types";

export const vendorsApi = {
  list: () => api.get<VendorResponse[]>("/api/vendors"),

  get: (vendorId: string) => api.get<VendorResponse>(`/api/vendors/${vendorId}`),

  create: (body: CreateVendorRequest) =>
    api.post<VendorResponse>("/api/vendors", body),

  deactivate: (vendorId: string) =>
    api.delete<VendorResponse>(`/api/vendors/${vendorId}`),

  listPOs: (vendorId: string) =>
    api.get<PurchaseOrderResponse[]>(`/api/vendors/${vendorId}/purchase-orders`),

  receivePO: (vendorId: string, poId: string) =>
    api.post<PurchaseOrderResponse>(
      `/api/vendors/${vendorId}/purchase-orders/${poId}/receive`
    ),

  createBill: (vendorId: string, poId: string, body: CreateBillRequest) =>
    api.post<BillResponse>(
      `/api/vendors/${vendorId}/purchase-orders/${poId}/bills`,
      body
    ),

  listOutstandingBills: () =>
    api.get<OutstandingBill[]>("/api/vendors/bills/outstanding"),

  listVendorBills: (vendorId: string, status?: string) =>
    api.get<BillResponse[]>(
      `/api/vendors/${vendorId}/bills`,
      status ? { status } : undefined
    ),

  getOverview: (vendorId: string) =>
    api.get<VendorOverview>(`/api/vendors/${vendorId}/overview`),

  getStatement: (vendorId: string) =>
    api.get<VendorStatement>(`/api/vendors/${vendorId}/statement`),

  payBill: (vendorId: string, billId: string, body: PayBillRequest) =>
    api.post<VendorBillPaymentResponse>(
      `/api/vendors/${vendorId}/bills/${billId}/payments`,
      body
    ),

  createVendorReturn: (vendorId: string, billId: string, body: VendorReturnRequest) =>
    api.post<VendorReturnResponse>(
      `/api/vendors/${vendorId}/bills/${billId}/returns`,
      body
    ),

  // Ledger import — endpoint not yet live on the backend (schema only). We still
  // POST to the implied path; ApiError surfaces the "awaiting backend" state.
  ledgerImport: (vendorId: string, body: LedgerImportRequest) =>
    api.post<void>(`/api/vendors/${vendorId}/ledger/import`, body),

  // ─── Receipt Ingestion ───

  processReceipt: (vendorId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http
      .post<{ status: number; message: string; data: ProcessReceiptResponse }>(
        `/api/vendors/${vendorId}/receipts/process`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((res) => res.data.data);
  },

  confirmReceipt: (vendorId: string, body: ReceiptConfirmRequest) =>
    api.post<ConfirmReceiptResponse>(
      `/api/vendors/${vendorId}/receipts/confirm`,
      body
    ),

  manualReceipt: (vendorId: string, body: ReceiptConfirmRequest) =>
    api.post<ConfirmReceiptResponse>(
      `/api/vendors/${vendorId}/receipts/manual`,
      body
    ),
};