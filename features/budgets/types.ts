export type ExpenseCategory = "RENT" | "UTILITIES" | "SUPPLIES" | "SALARIES" | "MAINTENANCE" | "OTHER";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "SALARIES",
  "MAINTENANCE",
  "OTHER",
];

export interface BudgetStatusItem {
  category: string;
  monthly_limit: number;
  actual_spent: number;
  remaining: number;
  exceeded: boolean;
}

export interface BudgetCreateRequest {
  category: ExpenseCategory;
  monthly_limit: number;
  notes?: string;
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function currentMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function cls(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
