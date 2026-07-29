import { reportsApi, ApiError } from "@/lib/api";
import type { BudgetCreateRequest } from "./types";
import type { BudgetStatusItem } from "./types";

const MOCK_STATUS: BudgetStatusItem[] = [
  { category: "RENT", monthly_limit: 15000, actual_spent: 12400, remaining: 2600, exceeded: false },
  { category: "UTILITIES", monthly_limit: 3000, actual_spent: 3250, remaining: -250, exceeded: true },
  { category: "SUPPLIES", monthly_limit: 5000, actual_spent: 2100, remaining: 2900, exceeded: false },
  { category: "SALARIES", monthly_limit: 45000, actual_spent: 42000, remaining: 3000, exceeded: false },
  { category: "MAINTENANCE", monthly_limit: 0, actual_spent: 850, remaining: -850, exceeded: true },
  { category: "OTHER", monthly_limit: 2000, actual_spent: 450, remaining: 1550, exceeded: false },
];

async function safeFetch<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 404 || err.status === 400) {
        console.warn(`Budgets API (${err.status}): ${err.message} — using fallback data`);
        return mock;
      }
      throw err;
    }
    console.warn("Budgets API network error — using fallback data", err);
    return mock;
  }
}

export const budgetsApi = {
  list: () => safeFetch(
    () => reportsApi.listBudgets(),
    [] as Awaited<ReturnType<typeof reportsApi.listBudgets>>
  ),

  status: (monthStart: string): Promise<BudgetStatusItem[]> =>
    safeFetch(
      async () => {
        const raw = await reportsApi.budgetStatus(monthStart);
        return raw.map((item) => ({
          category: item.category,
          monthly_limit: parseFloat(String(item.monthly_limit)),
          actual_spent: parseFloat(String(item.actual_spent)),
          remaining: parseFloat(String(item.remaining)),
          exceeded: item.exceeded,
        }));
      },
      MOCK_STATUS
    ),

  create: async (body: BudgetCreateRequest) => {
    try {
      return await reportsApi.createBudget(body);
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 403)) throw err;
      console.warn("Budgets API network error — create simulated", err);
      return {
        id: crypto.randomUUID?.() ?? "mock-id",
        tenant_id: "mock",
        category: body.category,
        monthly_limit: String(body.monthly_limit),
        active: true,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
    }
  },

  deactivate: async (id: string) => {
    try {
      await reportsApi.deleteBudget(id);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) throw err;
      console.warn("Budgets API network error — deactivate simulated", err);
    }
  },
};
