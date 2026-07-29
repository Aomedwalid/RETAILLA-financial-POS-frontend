import { api } from "@/lib/api";
import type {
  ExpenseResponse,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseSummary,
  ExpenseCategorySuggestion,
  PaginatedResponse,
} from "./types";

export const expensesApi = {
  list: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<PaginatedResponse<ExpenseResponse>>("/api/expenses", params),

  get: (id: string) =>
    api.get<ExpenseResponse>(`/api/expenses/${id}`),

  create: (body: ExpenseCreate) =>
    api.post<ExpenseResponse>("/api/expenses", body),

  update: (id: string, body: ExpenseUpdate) =>
    api.put<ExpenseResponse>(`/api/expenses/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/expenses/${id}`),

  summary: (params?: Record<string, string | number | boolean | null | undefined>) =>
    api.get<ExpenseSummary>("/api/expenses/summary", params),

  suggestCategory: (title: string) =>
    api.get<ExpenseCategorySuggestion[]>("/api/expenses/suggest-category", { title }),
};
