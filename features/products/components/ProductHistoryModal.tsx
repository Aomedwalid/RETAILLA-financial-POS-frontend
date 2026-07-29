"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api";
import type { ProductHistoryItem, PaginatedResponse } from "../types";
import { formatDateTime } from "@/lib/format";

interface ProductHistoryModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ProductHistoryModal({ productId, productName, onClose }: ProductHistoryModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedResponse<ProductHistoryItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError("");
    productsApi.getHistory(productId, { page, size: 10 })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t("product.failedToLoadHistory")))
      .finally(() => setLoading(false));
  }, [productId, page]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-lg mx-4 mb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <p className="text-sm font-bold text-on-surface">{t("product.history")}</p>
            <p className="text-xs text-on-surface-variant">{productName}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-surface-container-highest/60" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-error mb-2">error</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {data && !loading && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30 mb-2">history</span>
              <p className="text-sm text-on-surface-variant">{t("stock.noHistory")}</p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              <div className="space-y-2">
                {data.items.map((h) => (
                  <div key={h.id} className="flex items-center justify-between bg-surface-container-high rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm text-on-surface">{h.editor_email}</p>
                      <p className="text-xs text-on-surface-variant">{formatDateTime(h.edited_at)}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-primary/20 text-primary uppercase">{h.status}</span>
                  </div>
                ))}
              </div>

              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                  <span className="text-xs text-on-surface-variant">{t("common.page")} {page} {t("common.of")} {data.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                    className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
