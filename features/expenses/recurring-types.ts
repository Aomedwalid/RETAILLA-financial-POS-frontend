import type { ExpenseCategory } from "./types";

export type FrequencyType = "WEEKLY" | "MONTHLY" | "CUSTOM_DAYS";
export type PaymentMethod = "CASH" | "DIGITAL";
export type PendingStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "DISMISSED";

export const FREQUENCY_TYPES: FrequencyType[] = ["WEEKLY", "MONTHLY", "CUSTOM_DAYS"];

export const PENDING_STATUSES: PendingStatus[] = ["PENDING_CONFIRMATION", "CONFIRMED", "DISMISSED"];

export interface RecurringExpenseTemplate {
  id: string;
  tenant_id: string;
  title: string;
  category: ExpenseCategory;
  amount: string;
  payment_method: PaymentMethod;
  frequency_type: FrequencyType;
  frequency_interval_days: number | null;
  next_due_date: string;
  active: boolean;
  created_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpenseTemplateCreate {
  title: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  frequency_type: FrequencyType;
  frequency_interval_days?: number;
  next_due_date: string;
  notes?: string;
}

export interface RecurringExpenseTemplateUpdate {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  payment_method?: PaymentMethod;
  frequency_type?: FrequencyType;
  frequency_interval_days?: number;
  next_due_date?: string;
  active?: boolean;
  notes?: string;
}

export interface PendingRecurringExpense {
  id: string;
  tenant_id: string;
  template_id: string;
  template_title: string;
  title: string;
  category: string;
  amount: string;
  payment_method: string;
  due_date: string;
  status: PendingStatus;
  resolved_expense_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DismissRequest {
  notes?: string;
}

export interface ConfirmResult {
  expense: Record<string, unknown>;
}

export interface DismissResult {
  id: string;
  status: "DISMISSED";
}

export function frequencyLabel(ft: FrequencyType, intervalDays: number | null): string {
  switch (ft) {
    case "WEEKLY": return "Every week";
    case "MONTHLY": return "Every month";
    case "CUSTOM_DAYS": return `Every ${intervalDays ?? "?"} days`;
  }
}

const STATUS_COLORS: Record<PendingStatus, string> = {
  PENDING_CONFIRMATION: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-secondary/10 text-secondary border-secondary/30",
  DISMISSED: "bg-outline/10 text-outline border-outline/30",
};

const STATUS_LABELS: Record<PendingStatus, string> = {
  PENDING_CONFIRMATION: "Pending",
  CONFIRMED: "Confirmed",
  DISMISSED: "Dismissed",
};

export function pendingStatusBadgeClass(status: PendingStatus): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.PENDING_CONFIRMATION;
}

export function pendingStatusLabel(status: PendingStatus): string {
  return STATUS_LABELS[status] ?? status;
}
