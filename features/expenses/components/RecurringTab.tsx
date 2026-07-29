"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { recurringApi } from "@/features/expenses/recurring-api";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
  RecurringExpenseTemplate,
  RecurringExpenseTemplateCreate,
  RecurringExpenseTemplateUpdate,
  PendingRecurringExpense,
  FrequencyType,
  PaymentMethod,
  PendingStatus,
} from "@/features/expenses/recurring-types";
import {
  FREQUENCY_TYPES,
  frequencyLabel,
  pendingStatusBadgeClass,
  pendingStatusLabel,
} from "@/features/expenses/recurring-types";
import type { ExpenseCategory } from "@/features/expenses/types";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  formatCurrency,
  formatDate,
  cls,
  categoryLabel,
  categoryBadgeClass,
} from "@/features/expenses/types";

type TemplateModal =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; template: RecurringExpenseTemplate }
  | { type: "delete"; template: RecurringExpenseTemplate };

type PendingAction =
  | { type: "none" }
  | { type: "confirm"; item: PendingRecurringExpense }
  | { type: "dismiss"; item: PendingRecurringExpense };

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
        </td>
      ))}
    </tr>
  );
}

export default function RecurringTab() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [templateModal, setTemplateModal] = useState<TemplateModal>({ type: "none" });
  const [pendingAction, setPendingAction] = useState<PendingAction>({ type: "none" });
  const [showAllPending, setShowAllPending] = useState(false);

  const templatesQ = useQuery({
    queryKey: ["recurringTemplates"],
    queryFn: () => recurringApi.listTemplates(),
    enabled: !!accessToken,
  });
  const pendingQ = useQuery({
    queryKey: ["recurringPending", showAllPending],
    queryFn: () => recurringApi.listPending(showAllPending ? undefined : "PENDING_CONFIRMATION"),
    enabled: !!accessToken,
  });

  const loadingTemplates = templatesQ.isLoading;
  const errorTemplates = templatesQ.error;
  const templates = templatesQ.data ?? [];

  const loadingPending = pendingQ.isLoading;
  const errorPending = pendingQ.error;
  const pending = pendingQ.data ?? [];

  const triggerRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["recurringTemplates"] });
    queryClient.invalidateQueries({ queryKey: ["recurringPending"] });
  }, [queryClient]);

  function handleTemplateSuccess() {
    setTemplateModal({ type: "none" });
    triggerRefresh();
  }

  function handlePendingActionSuccess() {
    setPendingAction({ type: "none" });
    triggerRefresh();
  }

  const pendingConfirmCount = pending.filter((p) => p.status === "PENDING_CONFIRMATION").length;

  return (
    <div className="space-y-stack-lg">
      {/* ─── Templates Section ─── */}
      <div>
        <div className="flex items-center justify-between mb-gutter">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{t("expense.recurring.templates")}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {t("expense.recurring.templatesDesc")}
            </p>
          </div>
          <button
            onClick={() => setTemplateModal({ type: "create" })}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            {t("expense.recurring.addTemplate")}
          </button>
        </div>

        {errorTemplates && (
          <div className="mb-gutter bg-error/10 border border-error/20 rounded-lg px-5 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-error mt-0.5">error_outline</span>
            <div>
              <p className="font-body-md text-body-md text-error font-semibold">{t("common.failedToLoad")}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{errorTemplates?.message ?? t("common.unknownError")}</p>
            </div>
          </div>
        )}

        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.title")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.category")}</th>
                <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.amount")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.frequency")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.nextDue")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.method")}</th>
                <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loadingTemplates ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 mb-3 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <span className="material-symbols-outlined text-3xl text-outline-variant" style={{ fontVariationSettings: "'wght' 200" }}>repeat</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.recurring.noTemplates")}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t("expense.recurring.templatesDesc")}</p>
                      <button
                        onClick={() => setTemplateModal({ type: "create" })}
                        className="mt-5 bg-primary text-on-primary px-5 py-2 rounded-xl font-semibold flex items-center gap-2 hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined">add</span>
                        {t("expense.recurring.createFirstTemplate")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-highest transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-body-md font-bold text-on-surface">{t.title}</div>
                      {t.notes && <div className="text-[12px] text-on-surface-variant mt-0.5 line-clamp-1">{t.notes}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cls("px-2 py-1 border rounded text-[11px] font-bold", categoryBadgeClass(t.category))}>
                        {categoryLabel(t.category)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-data-table text-on-surface tabular-nums">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                      {frequencyLabel(t.frequency_type, t.frequency_interval_days)}
                    </td>
                    <td className="py-4 px-6 font-data-table text-on-surface-variant text-sm">
                      {formatDate(t.next_due_date)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md">
                        <span className="material-symbols-outlined text-[16px]">
                          {t.payment_method === "CASH" ? "payments" : "credit_card"}
                        </span>
                        {t.payment_method}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setTemplateModal({ type: "edit", template: t })}
                          className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setTemplateModal({ type: "delete", template: t })}
                          className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {templates.length > 0 && (
            <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {templates.length} {t("expenseRecurring.activeTemplates")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Pending Review Section ─── */}
      <div>
        <div className="flex items-center justify-between mb-gutter">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{t("expense.recurring.pendingReview")}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {t("expense.recurring.pendingDesc")}
              </p>
            </div>
            {pendingConfirmCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[11px] font-bold">
{pendingConfirmCount} {t("expense.recurring.pending")}
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[12px] text-on-surface-variant font-medium">{t("expense.recurring.showAllStatuses")}</span>
            <div
              onClick={() => setShowAllPending(!showAllPending)}
              className={cls(
                "w-9 h-5 rounded-full transition-colors relative",
                showAllPending ? "bg-primary" : "bg-surface-container-highest border border-outline-variant"
              )}
            >
              <div
                className={cls(
                  "w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all",
                  showAllPending ? "left-[18px]" : "left-[2px]"
                )}
              />
            </div>
          </label>
        </div>

        {errorPending && (
          <div className="mb-gutter bg-error/10 border border-error/20 rounded-lg px-5 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-error mt-0.5">error_outline</span>
            <div>
              <p className="font-body-md text-body-md text-error font-semibold">{t("common.failedToLoad")}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{errorPending?.message ?? t("common.unknownError")}</p>
            </div>
          </div>
        )}

        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.templateTitle")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.title")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.category")}</th>
                <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.amount")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("expense.recurring.nextDueDate")}</th>
                <th className="text-left py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.status")}</th>
                <th className="text-right py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loadingPending ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 mb-3 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <span className="material-symbols-outlined text-3xl text-outline-variant" style={{ fontVariationSettings: "'wght' 200" }}>check_circle</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.recurring.allCaughtUp")}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        {showAllPending ? t("expense.recurring.noPendingHistory") : t("expense.recurring.noPending")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-highest transition-colors group">
                    <td className="py-4 px-6 font-body-md text-on-surface">{p.template_title}</td>
                    <td className="py-4 px-6 font-body-md text-on-surface-variant">{p.title}</td>
                    <td className="py-4 px-6">
                      <span className={cls("px-2 py-1 border rounded text-[11px] font-bold", categoryBadgeClass(p.category as ExpenseCategory))}>
                        {categoryLabel(p.category as ExpenseCategory)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-data-table text-on-surface tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-4 px-6 font-data-table text-on-surface-variant text-sm">
                      {formatDate(p.due_date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cls("px-2.5 py-1 rounded-full border text-[11px] font-bold", pendingStatusBadgeClass(p.status))}>
                        {pendingStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {p.status === "PENDING_CONFIRMATION" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPendingAction({ type: "confirm", item: p })}
                            className="px-3 py-1.5 rounded-lg text-secondary hover:bg-secondary/10 font-semibold text-[12px] transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            {t("common.confirm")}
                          </button>
                          <button
                            onClick={() => setPendingAction({ type: "dismiss", item: p })}
                            className="px-3 py-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 font-semibold text-[12px] transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            {t("expense.recurring.dismissExpense")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-on-surface-variant italic">
                          {p.status === "CONFIRMED" ? t("expenseRecurring.resolved") : t("expenseRecurring.skipped")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {pending.length > 0 && (
            <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {pending.length} {t("expenseRecurring.items")}
                {!showAllPending && pendingConfirmCount > 0 && (
                  <span className="ml-2">· {pendingConfirmCount} {t("expenseRecurring.pendingConfirmation")}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Template Create/Edit Modal ─── */}
      {(templateModal.type === "create" || templateModal.type === "edit") && (
        <TemplateFormModal
          template={templateModal.type === "edit" ? templateModal.template : undefined}
          onClose={() => setTemplateModal({ type: "none" })}
          onSuccess={handleTemplateSuccess}
        />
      )}

      {/* ─── Template Delete Dialog ─── */}
      {templateModal.type === "delete" && (
        <DeleteTemplateDialog
          template={templateModal.template}
          onClose={() => setTemplateModal({ type: "none" })}
          onSuccess={handleTemplateSuccess}
        />
      )}

      {/* ─── Confirm Pending Dialog ─── */}
      {pendingAction.type === "confirm" && (
        <ConfirmPendingDialog
          item={pendingAction.item}
          onClose={() => setPendingAction({ type: "none" })}
          onSuccess={handlePendingActionSuccess}
        />
      )}

      {/* ─── Dismiss Pending Modal ─── */}
      {pendingAction.type === "dismiss" && (
        <DismissPendingModal
          item={pendingAction.item}
          onClose={() => setPendingAction({ type: "none" })}
          onSuccess={handlePendingActionSuccess}
        />
      )}
    </div>
  );
}

// ─── Template Form Modal (Create / Edit) ───

function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: {
  template?: RecurringExpenseTemplate;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!template;
  const parseAmount = () => (template?.amount ? parseFloat(template.amount) : 0);

  const [title, setTitle] = useState(template?.title ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(template?.category ?? "RENT");
  const [amount, setAmount] = useState(isEdit && parseAmount() > 0 ? String(parseAmount()) : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(template?.payment_method ?? "DIGITAL");
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(template?.frequency_type ?? "MONTHLY");
  const [intervalDays, setIntervalDays] = useState(template?.frequency_interval_days ? String(template.frequency_interval_days) : "");
  const [nextDueDate, setNextDueDate] = useState(template?.next_due_date ? template.next_due_date.slice(0, 10) : "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError(t("validation.titleRequired")); return; }
    const amt = parseFloat(amount);
    if (!amount || amt <= 0) { setError(t("validation.amountPositive")); return; }
    if (!nextDueDate) { setError(t("expense.recurring.nextDueDateRequired")); return; }
    if (frequencyType === "CUSTOM_DAYS") {
      const days = parseInt(intervalDays, 10);
      if (!days || days <= 0) { setError(t("expense.recurring.intervalDaysRequired")); return; }
    }

    setError(""); setSaving(true);
    try {
      const base = {
        title: title.trim(),
        category,
        amount: amt,
        payment_method: paymentMethod,
        frequency_type: frequencyType,
        next_due_date: new Date(nextDueDate).toISOString(),
      };

      if (isEdit) {
        const body: RecurringExpenseTemplateUpdate = { ...base };
        if (frequencyType === "CUSTOM_DAYS") body.frequency_interval_days = parseInt(intervalDays, 10);
        else body.frequency_interval_days = undefined;
        if (notes.trim()) body.notes = notes.trim();
        else body.notes = "";
        await recurringApi.updateTemplate(template!.id, body);
      } else {
        const body: RecurringExpenseTemplateCreate = { ...base };
        if (frequencyType === "CUSTOM_DAYS") body.frequency_interval_days = parseInt(intervalDays, 10);
        if (notes.trim()) body.notes = notes.trim();
        await recurringApi.createTemplate(body);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("expense.recurring.failedToSave"));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {isEdit ? t("expense.recurring.editTemplate") : t("expense.recurring.newTemplate")}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "none" }}>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.title")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
              placeholder={t("expense.recurring.titlePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.category")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.amount")} ($)</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-body-md">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pr-7 pl-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.paymentMethod")}</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method as PaymentMethod)}
                  className={cls(
                    "p-3 rounded-lg border transition-all flex items-center justify-center gap-2 font-body-md",
                    paymentMethod === method
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {method === "CASH" ? "payments" : "credit_card"}
                  </span>
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.frequency")}</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCY_TYPES.map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFrequencyType(ft)}
                  className={cls(
                    "p-3 rounded-lg border transition-all text-center font-body-md",
                    frequencyType === ft
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  )}
                >
                  <span className="text-[11px] font-bold">{ft === "WEEKLY" ? t("frequency.weekly") : ft === "MONTHLY" ? t("frequency.monthly") : t("frequency.custom")}</span>
                </button>
              ))}
            </div>
          </div>

          {frequencyType === "CUSTOM_DAYS" && (
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.intervalDays")}</label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
                placeholder={t("expense.recurring.intervalPlaceholder")}
              />
            </div>
          )}

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.nextDueDate")}</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
            />
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.notesOptional")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("expense.recurring.notesPlaceholder")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {saving ? t("common.saving") : isEdit ? t("expense.recurring.saveChanges") : t("expense.recurring.createTemplate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Template Dialog ───

function DeleteTemplateDialog({
  template,
  onClose,
  onSuccess,
}: {
  template: RecurringExpenseTemplate;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setSaving(true); setError("");
    try {
      await recurringApi.deleteTemplate(template.id);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("expense.recurring.failedToDelete"));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.recurring.deleteTemplate")}</h3>
              <p className="text-sm text-on-surface-variant">{template.title}</p>
            </div>
          </div>
          <div className="bg-error/5 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">info</span>
            <p className="text-sm text-on-surface-variant">
              {t("expense.recurring.deactivateNote")}
            </p>
          </div>
          <p className="text-on-surface font-body-md">{t("expense.recurring.deactivateConfirm")}</p>
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors font-body-md">
            {t("common.cancel")}
          </button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-error text-on-error font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all">
            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {saving ? t("expense.recurring.deactivating") : t("expense.recurring.deactivateLabel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Pending Dialog ───

function ConfirmPendingDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: PendingRecurringExpense;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setSaving(true); setError("");
    try {
      await recurringApi.confirmPending(item.id);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("expense.recurring.failedToConfirm"));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">check_circle</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.recurring.confirmExpense")}</h3>
              <p className="text-sm text-on-surface-variant">{item.title}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("expense.recurring.templateTitle")}</span>
              <span className="text-on-surface font-medium">{item.template_title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("expense.recurring.amount")}</span>
              <span className="text-on-surface font-bold font-data-table">{formatCurrency(item.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("expense.recurring.category")}</span>
              <span>{categoryLabel(item.category as ExpenseCategory)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t("expense.recurring.nextDueDate")}</span>
              <span className="text-on-surface">{formatDate(item.due_date)}</span>
            </div>
          </div>

          <div className="bg-error/5 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mb-1">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
            <div className="text-sm text-on-surface-variant">
              <p className="mb-1">
                {t("expense.recurring.confirmExpenseWarning", { amount: formatCurrency(item.amount) })}
              </p>
              <p className="text-error font-semibold">{t("expense.recurring.confirmExpenseIrreversible")}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors font-body-md">
            {t("common.cancel")}
          </button>
          <button onClick={handleConfirm} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-secondary text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all">
            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {saving ? t("expense.recurring.confirming") : t("expense.recurring.confirmExpense")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dismiss Pending Modal ───

function DismissPendingModal({
  item,
  onClose,
  onSuccess,
}: {
  item: PendingRecurringExpense;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [dismissNotes, setDismissNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleDismiss() {
    setSaving(true); setError("");
    try {
      await recurringApi.dismissPending(item.id, { notes: dismissNotes.trim() || undefined });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("expense.recurring.failedToDismiss"));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-outline/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-outline">cancel</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("expense.recurring.dismissExpense")}</h3>
              <p className="text-sm text-on-surface-variant">{item.title}</p>
            </div>
          </div>
          <p className="text-on-surface font-body-md mb-4">
            {t("expense.recurring.dismissNote")}
          </p>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1.5 block">{t("expense.recurring.reason")} <span className="text-outline/60">{t("common.optional")}</span></label>
            <textarea
              value={dismissNotes}
              onChange={(e) => setDismissNotes(e.target.value)}
              rows={3}
              placeholder={t("expense.recurring.reasonPlaceholder")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors font-body-md">
            {t("common.cancel")}
          </button>
          <button onClick={handleDismiss} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-outline text-on-surface font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all">
            {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {saving ? t("expense.recurring.dismissing") : t("expense.recurring.dismissExpense")}
          </button>
        </div>
      </div>
    </div>
  );
}
