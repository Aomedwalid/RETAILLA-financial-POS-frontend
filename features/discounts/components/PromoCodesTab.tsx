"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePromoCodes, useDeletePromoCode, useActivatePromoCode } from "../hooks";
import { formatCurrency } from "@/lib/format";
import type { PromoCode } from "../types";
import PromoCodeSlideOver from "./PromoCodeSlideOver";
import PromoCodeDetailsModal from "./PromoCodeDetailsModal";
import ConfirmDialog from "./ConfirmDialog";
import PromoValidationCard from "./PromoValidationCard";
import Toast from "./Toast";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "details"; promoCode: PromoCode }
  | { type: "edit"; promoCode: PromoCode }
  | { type: "delete"; promoCode: PromoCode }
  | { type: "activate"; promoCode: PromoCode };

interface ToastState {
  message: string;
  type: "success" | "error";
  id: number;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  return 0;
}

function formatPercent(v: unknown) {
  const n = toNum(v);
  return n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PromoCodesTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchLocal, setSearchLocal] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastId = useRef(0);

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const keyword = searchParams.get("keyword") ?? "";
  const size = 15;

  const promoCodesQ = usePromoCodes({ page, size, keyword });
  const data = promoCodesQ.data;
  const loading = promoCodesQ.isLoading;

  const deletePromoCodeMutation = useDeletePromoCode();
  const activatePromoCodeMutation = useActivatePromoCode();

  function addToast(message: string, type: "success" | "error") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { message, type, id }]);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleView(promoCode: PromoCode) {
    setModal({ type: "details", promoCode });
  }

  function updateURL(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleSearch(val: string) {
    setSearchLocal(val);
    const timer = setTimeout(() => updateURL("keyword", val), 300);
    return () => clearTimeout(timer);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleSaved() {
    setModal({ type: "none" });
    addToast("Promo code saved successfully", "success");
  }

  function handleDelete(promoCode: PromoCode) {
    setModal({ type: "delete", promoCode });
  }

  async function confirmDelete(promoCode: PromoCode) {
    await deletePromoCodeMutation.mutateAsync(promoCode.id);
    setModal({ type: "none" });
    addToast("Promo code deleted successfully", "success");
  }

  function handleActivate(promoCode: PromoCode) {
    setModal({ type: "activate", promoCode });
  }

  async function confirmActivate(promoCode: PromoCode) {
    await activatePromoCodeMutation.mutateAsync(promoCode.id);
    setModal({ type: "none" });
    addToast(
      promoCode.active ? "Promo code deactivated" : "Promo code activated",
      "success"
    );
  }

  const promoCodes = data?.items ?? [];

  return (
    <div className="space-y-stack-md">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            defaultValue={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search promo codes..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => promoCodesQ.refetch()}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
          <button
            onClick={() => setModal({ type: "create" })}
            className="bg-primary text-on-primary px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Promo Code
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-x-auto overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Code</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Type</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Value</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Status</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Times Used</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">Expires</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-card-padding py-4">
                        <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-card-padding py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[48px] text-outline" style={{ fontVariationSettings: "'wght' 200" }}>
                        loyalty
                      </span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">No promo codes yet</p>
                      <p className="text-on-surface-variant text-sm max-w-xs">
                        Create your first promo code to share with customers and drive sales.
                      </p>
                      <button
                        onClick={() => setModal({ type: "create" })}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all mt-2"
                      >
                        Create Promo Code
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                promoCodes.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-card-padding py-4">
                      <button
                        onClick={() => handleView(p)}
                        className="font-data-table text-data-table bg-surface-container-highest/50 px-2 py-1 rounded text-primary border border-outline-variant/50 hover:border-primary/50 transition-colors"
                      >
                        {p.code}
                      </button>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {p.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="font-data-table text-data-table text-primary">
                        {p.type === "PERCENTAGE" ? formatPercent(p.value) : formatCurrency(p.value)}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-tighter border ${
                          p.active
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : "bg-outline/10 text-outline border-outline/20"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? "bg-secondary" : "bg-outline"}`} />
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-tighter border ${
                        p.used
                          ? "bg-error/10 text-error border-error/20"
                          : "bg-secondary/10 text-secondary border-secondary/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.used ? "bg-error" : "bg-secondary"}`} />
                        {p.used ? "Used" : "Available"}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="text-sm text-on-surface-variant">
                        {p.expires_at ? formatDate(p.expires_at) : "No expiry"}
                      </span>
                    </td>
                    <td className="px-card-padding py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ type: "edit", promoCode: p })}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleActivate(p)}
                          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant transition-colors ${
                            p.active ? "text-yellow-400 hover:text-yellow-300" : "text-secondary hover:text-secondary"
                          }`}
                          title={p.active ? "Deactivate" : "Activate"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {p.active ? "pause_circle" : "play_circle"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete"
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
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-card-padding py-4 bg-surface-container-high/30 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-body-md text-on-surface-variant text-sm">
              Showing <span className="text-on-surface font-semibold">1-{Math.min(size, data.total)}</span> of{" "}
              <span className="text-on-surface font-semibold">{data.total}</span> promo codes
            </p>
            <div className="flex items-center gap-4">
              <span className="text-body-md text-on-surface-variant text-sm">
                Page {page} of {data.pages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= data.pages}
                  className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Promo Validation Card */}
      <PromoValidationCard />

      {/* Modals */}
      {modal.type === "details" && (
        <PromoCodeDetailsModal
          promoCode={modal.promoCode}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => setModal({ type: "edit", promoCode: modal.promoCode })}
        />
      )}

      {(modal.type === "create" || modal.type === "edit") && (
        <PromoCodeSlideOver
          promoCode={modal.type === "edit" ? modal.promoCode : null}
          onClose={() => setModal({ type: "none" })}
          onSaved={handleSaved}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {modal.type === "delete" && (
        <ConfirmDialog
          title="Delete Promo Code"
          message={`Are you sure you want to delete "${modal.promoCode.code}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => confirmDelete(modal.promoCode)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "activate" && (
        <ConfirmDialog
          title={modal.promoCode.active ? "Deactivate Promo Code" : "Activate Promo Code"}
          message={
            modal.promoCode.active
              ? `Deactivate "${modal.promoCode.code}"? It will no longer be usable at checkout.`
              : `Activate "${modal.promoCode.code}"? It can then be used at checkout.`
          }
          confirmLabel={modal.promoCode.active ? "Deactivate" : "Activate"}
          variant="warning"
          onConfirm={() => confirmActivate(modal.promoCode)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {/* Toasts */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
