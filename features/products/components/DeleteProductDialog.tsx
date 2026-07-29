"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api";
import type { ProductResponse } from "../types";

interface DeleteProductDialogProps {
  product: ProductResponse;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteProductDialog({ product, onClose, onDeleted }: DeleteProductDialogProps) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await productsApi.delete(product.id);
      onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("product.failedToDelete");
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-sm p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error">delete</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{t("product.delete")}</p>
            <p className="text-xs text-on-surface-variant">{t("common.thisActionCannotBeUndone")}</p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant mb-6">
          {t("product.deleteConfirm")} <span className="font-bold text-on-surface">{product.name}</span>?
        </p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg mb-4">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-error text-on-error text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {deleting ? t("common.saving") : t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
