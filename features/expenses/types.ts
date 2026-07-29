"use client";

export type ExpensePaymentMethod = "CASH" | "DIGITAL";
export type ExpensePaymentStatus = "PENDING" | "COMPLETED";
export type ExpenseCategory = "RENT" | "UTILITIES" | "SUPPLIES" | "SALARIES" | "MAINTENANCE" | "OTHER";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "SALARIES",
  "MAINTENANCE",
  "OTHER",
];

export const EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = ["CASH", "DIGITAL"];

export interface ExpenseResponse {
  id: string;
  title: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  payment_status: ExpensePaymentStatus;
  notes: string | null;
  category: ExpenseCategory;
  expense_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  title: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  category: ExpenseCategory;
  notes?: string;
}

export interface ExpenseUpdate {
  title?: string;
  amount?: number;
  payment_method?: ExpensePaymentMethod;
  category?: ExpenseCategory;
  notes?: string;
}

export interface ExpenseSummary {
  expenses_count: number;
  total_expenses: number;
  average_expense: number;
  highest_expense: number;
}

export interface ExpenseCategorySuggestion {
  suggested_category: string;
  confidence_score: number;
  matched_expense_count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return "0.00 ج.م";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ج.م";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function cls(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies",
  SALARIES: "Salaries",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

export function categoryLabel(cat: ExpenseCategory): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  RENT: "bg-primary/10 text-primary border-primary/20",
  UTILITIES: "bg-tertiary/10 text-tertiary border-tertiary/20",
  SUPPLIES: "bg-secondary/10 text-secondary border-secondary/20",
  SALARIES: "bg-on-secondary-fixed-variant/10 text-secondary-fixed-dim border-on-secondary-fixed-variant/20",
  MAINTENANCE: "bg-error-container/10 text-error border-error-container/20",
  OTHER: "bg-surface-variant/30 text-on-surface-variant border-outline-variant",
};

export function categoryBadgeClass(cat: ExpenseCategory): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.OTHER;
}
