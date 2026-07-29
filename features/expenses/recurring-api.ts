import { api } from "@/lib/api";
import type {
  RecurringExpenseTemplate,
  RecurringExpenseTemplateCreate,
  RecurringExpenseTemplateUpdate,
  PendingRecurringExpense,
  DismissRequest,
  ConfirmResult,
  DismissResult,
} from "./recurring-types";

export const recurringApi = {
  createTemplate: (body: RecurringExpenseTemplateCreate) =>
    api.post<RecurringExpenseTemplate>("/api/recurring-expenses/templates", body),

  listTemplates: () =>
    api.get<RecurringExpenseTemplate[]>("/api/recurring-expenses/templates"),

  updateTemplate: (id: string, body: RecurringExpenseTemplateUpdate) =>
    api.patch<RecurringExpenseTemplate>(`/api/recurring-expenses/templates/${id}`, body),

  deleteTemplate: (id: string) =>
    api.delete<void>(`/api/recurring-expenses/templates/${id}`),

  listPending: (status?: string) => {
    const params: Record<string, string | number | boolean | null | undefined> = {};
    if (status) params.status = status;
    return api.get<PendingRecurringExpense[]>("/api/recurring-expenses/pending", params);
  },

  confirmPending: (id: string) =>
    api.post<ConfirmResult>(`/api/recurring-expenses/pending/${id}/confirm`),

  dismissPending: (id: string, body?: DismissRequest) =>
    api.post<DismissResult>(`/api/recurring-expenses/pending/${id}/dismiss`, body ?? {}),
};
