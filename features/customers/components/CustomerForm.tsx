"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { customersApi } from "../api";
import { validateCustomerForm, validatePhone, normalizePhone } from "../validation";
import type { CustomerListItem } from "../types";

interface CustomerFormProps {
  customer?: CustomerListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerForm({ customer, onClose, onSaved }: CustomerFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    const err = validatePhone(value);
    setPhoneError(err ?? "");
    setPhoneTouched(true);
  }, []);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === "phone") {
      setPhoneError("");
    }
  }

  async function handleSubmit() {
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;
    const errors = validateCustomerForm({ name, email, phone: normalizedPhone });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError("");
    setSubmitting(true);
    try {
      const payload = { name, email: email || undefined, phone: normalizedPhone };
      if (customer) {
        await customersApi.update(customer.id, payload);
      } else {
        await customersApi.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  const livePhoneErr = phoneTouched && phoneError ? phoneError : "";
  const displayPhoneErr = livePhoneErr || fieldErrors.phone || "";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-[95vw] md:w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {customer ? t("customer.edit") : t("customer.addNew")}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          <section className="space-y-4">
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("customer.name")} *</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                className={`w-full bg-surface-container-lowest border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors ${fieldErrors.name ? "border-error" : "border-outline-variant"}`}
                placeholder={t("customer.name")}
              />
              {fieldErrors.name && <p className="text-[11px] text-error mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("customer.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                className={`w-full bg-surface-container-lowest border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors ${fieldErrors.email ? "border-error" : "border-outline-variant"}`}
                placeholder={t("customer.email")}
              />
              {fieldErrors.email && <p className="text-[11px] text-error mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("customer.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full bg-surface-container-lowest border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md transition-colors ${displayPhoneErr ? "border-error" : "border-outline-variant"}`}
                placeholder={t("customer.phone")}
              />
              {displayPhoneErr && (
                <p className="text-[11px] text-error mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {displayPhoneErr}
                </p>
              )}
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("customer.saving") : customer ? t("customer.saveChanges") : t("customer.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
