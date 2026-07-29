import { api } from "@/lib/api";
import type {
  StoreCreditBalance,
  StoreCreditLedgerEntry,
  StoreCreditOverview,
  StoreCreditIssueRequest,
  StoreCreditRedeemRequest,
} from "./types";

export const storeCreditApi = {
  getBalances: (params?: { page?: number; size?: number }) =>
    api.get<import("./types").StoreCreditBalancesPaginatedResponse>(
      "/api/customers/store-credit/balances",
      params as Record<string, string | number | boolean | null | undefined>,
    ),

  getBalance: (customerId: string) =>
    api.get<StoreCreditBalance>(`/api/customers/${customerId}/store-credit/balance`),

  getHistory: (customerId: string, startDate?: string, endDate?: string) =>
    api.get<StoreCreditLedgerEntry[]>(
      `/api/customers/${customerId}/store-credit/history`,
      { start_date: startDate, end_date: endDate } as Record<string, string | number | boolean | null | undefined>,
    ),

  getOverview: (customerId: string, startDate?: string, endDate?: string) =>
    api.get<StoreCreditOverview>(
      `/api/customers/${customerId}/store-credit/overview`,
      { start_date: startDate, end_date: endDate } as Record<string, string | number | boolean | null | undefined>,
    ),

  issue: (customerId: string, body: StoreCreditIssueRequest) =>
    api.post<Record<string, unknown>>(`/api/customers/${customerId}/store-credit/issue`, body),

  redeem: (customerId: string, body: StoreCreditRedeemRequest) =>
    api.post<Record<string, unknown>>(`/api/customers/${customerId}/store-credit/redeem`, body),
};

export const poolApi = {
  getPool: () =>
    api.get<{ balance: string }>("/api/store-credit-pool/"),

  deposit: (body: { amount: number; notes?: string }) =>
    api.post<Record<string, unknown>>("/api/store-credit-pool/deposit", body),

  withdraw: (body: { amount: number; notes?: string }) =>
    api.post<Record<string, unknown>>("/api/store-credit-pool/withdraw", body),

  issueToCustomer: (body: { customer_id: string; amount: number; notes?: string }) =>
    api.post<Record<string, unknown>>("/api/store-credit-pool/issue", body),

  returnFromCustomer: (body: { customer_id: string; amount: number; notes?: string }) =>
    api.post<Record<string, unknown>>("/api/store-credit-pool/return", body),

  getHistory: (startDate?: string, endDate?: string) =>
    api.get<import("./types").PoolLedgerEntry[]>(
      "/api/store-credit-pool/history",
      { start_date: startDate, end_date: endDate } as Record<string, string | number | boolean | null | undefined>,
    ),

  getOverview: (startDate?: string, endDate?: string) =>
    api.get<import("./types").PoolOverview>(
      "/api/store-credit-pool/overview",
      { start_date: startDate, end_date: endDate } as Record<string, string | number | boolean | null | undefined>,
    ),
};
