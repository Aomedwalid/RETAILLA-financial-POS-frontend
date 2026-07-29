import type { VendorResponse } from "@/features/vendors/types";
import { fmt } from "@/features/vendors/types";

export function formatDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysUntil(dueDate: string | null): number {
  if (!dueDate) return Infinity;
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (status === "PAID" || !dueDate) return false;
  return daysUntil(dueDate) < 0;
}

export function getBalance(v: VendorResponse): number {
  return v.outstanding_balance ? parseFloat(v.outstanding_balance) : 0;
}