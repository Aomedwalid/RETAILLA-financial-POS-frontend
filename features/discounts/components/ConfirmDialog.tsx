"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  variant = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel || t("common.confirm");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setError("");
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.operationFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div
        className="relative w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <span
            className={`material-symbols-outlined text-[48px] ${
              variant === "danger" ? "text-error" : "text-yellow-400"
            }`}
          >
            {variant === "danger" ? "delete_forever" : "warning"}
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <p className="text-on-surface-variant text-sm">{message}</p>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg text-left">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
                variant === "danger"
                  ? "bg-error text-on-error hover:brightness-110"
                  : "bg-yellow-500 text-black hover:brightness-110"
              }`}
            >
              {submitting && (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              )}
              {submitting ? t("common.processing") : resolvedConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
