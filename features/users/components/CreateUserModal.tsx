"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usersApi } from "../api";
import type { CreateUserRequest } from "../types";

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const { t } = useTranslation();

  function validatePassword(password: string): string | null {
    if (password.length < 9) return t("user.passwordLength");
    if (!/[a-zA-Z]/.test(password)) return t("user.passwordLetter");
    if (!/[0-9]/.test(password)) return t("user.passwordDigit");
    return null;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CASHIER" | "ADMIN">("CASHIER");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = t("user.emailRequired");
    const pwError = validatePassword(password);
    if (pwError) errors.password = pwError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError("");
    setSubmitting(true);
    try {
      await usersApi.create({ email, password, role } as CreateUserRequest);
      onCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("EMAIL_ALREADY_EXISTS")) {
          setFieldErrors((prev) => ({ ...prev, email: t("user.emailAlreadyExists") }));
        } else {
          setError(msg);
        }
      } else {
        setError(t("user.failedToCreate"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-[95vw] md:w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("user.provisionNew")}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("user.emailAddress")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md placeholder:text-on-surface-variant/30"
              placeholder={t("user.emailPlaceholder")}
            />
            {fieldErrors.email && <p className="text-[11px] text-error mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("user.temporaryPassword")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md placeholder:text-on-surface-variant/30"
                placeholder={t("user.passwordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {fieldErrors.password && <p className="text-[11px] text-error mt-1">{fieldErrors.password}</p>}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
              <p className="text-[10px] text-on-surface-variant italic">{t("user.passwordRequirement")}</p>
            </div>
          </div>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("user.accessRole")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "CASHIER" | "ADMIN")}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md appearance-none cursor-pointer"
            >
              <option value="CASHIER">{t("user.cashierRole")}</option>
              <option value="ADMIN">{t("user.adminRole")}</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors"
          >
            {t("user.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("user.creating") : t("user.createAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
