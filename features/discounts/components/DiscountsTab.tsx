"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter } from "next/navigation";
import { useDiscounts, useDeleteDiscount, useActivateDiscount } from "../hooks";
import { formatCurrency } from "@/lib/format";
import type { Discount } from "../types";
import DiscountSlideOver from "./DiscountSlideOver";
import DiscountDetailsModal from "./DiscountDetailsModal";
import AssignProductsModal from "./AssignProductsModal";
import ConfirmDialog from "./ConfirmDialog";
import Toast from "./Toast";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "details"; discountId: string }
  | { type: "edit"; discount: Discount }
  | { type: "delete"; discount: Discount }
  | { type: "activate"; discount: Discount }
  | { type: "assign-products"; discount: Discount };

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

export default function DiscountsTab() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchLocal, setSearchLocal] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastId = useRef(0);

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const keyword = searchParams.get("keyword") ?? "";
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortOrder = searchParams.get("sort_order") ?? "desc";
  const size = 10;

  const discountsQ = useDiscounts({ page, size, keyword, sort_by: sortBy, sort_order: sortOrder });
  const data = discountsQ.data;
  const loading = discountsQ.isLoading;

  const deleteDiscountMutation = useDeleteDiscount();
  const activateDiscountMutation = useActivateDiscount();

  function addToast(message: string, type: "success" | "error") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { message, type, id }]);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleView(discountId: string) {
    setModal({ type: "details", discountId });
  }

  function handleEdit(discount: Discount) {
    setModal({ type: "edit", discount });
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
    addToast(t("common.success"), "success");
  }

  function handleDelete(discount: Discount) {
    setModal({ type: "delete", discount });
  }

  async function confirmDelete(discount: Discount) {
    await deleteDiscountMutation.mutateAsync(discount.id);
    setModal({ type: "none" });
    addToast(t("common.success"), "success");
  }

  function handleActivate(discount: Discount) {
    setModal({ type: "activate", discount });
  }

  async function confirmActivate(discount: Discount) {
    await activateDiscountMutation.mutateAsync(discount.id);
    setModal({ type: "none" });
    addToast(
      discount.active ? t("common.disabled") : t("common.enabled"),
      "success"
    );
  }

  function handleAssignProducts(discount: Discount) {
    setModal({ type: "assign-products", discount });
  }

  function handleProductsAssigned() {
    setModal({ type: "none" });
    addToast(t("common.success"), "success");
  }

  const discounts = data?.items ?? [];

  return (
    <div className="space-y-stack-md">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            defaultValue={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("discount.searchDiscounts")}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pr-10 pl-4 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[18px]">sort</span>
            <select
              value={`${sortBy}|${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("|");
                const params = new URLSearchParams(searchParams.toString());
                params.set("sort_by", field);
                params.set("sort_order", order);
                params.delete("page");
                router.push(`?${params.toString()}`, { scroll: false });
              }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-body-md text-on-surface-variant outline-none focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="created_at|desc">{t("product.newest")}</option>
              <option value="created_at|asc">{t("product.oldest")}</option>
              <option value="name|asc">{t("product.nameAZ")}</option>
              <option value="name|desc">{t("product.nameZA")}</option>
              <option value="value|desc">{t("discount.totalDiscount")}</option>
              <option value="value|asc">{t("discount.avgDiscount")}</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => discountsQ.refetch()}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
              title={t("common.refresh")}
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={() => setModal({ type: "create" })}
              className="bg-primary text-on-primary px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t("discount.createDiscount")}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-x-auto overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.name")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.type")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("discount.totalDiscount")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("discount.percent")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.status")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("product.title")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.date")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("common.actions")}</th>
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
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-card-padding py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[48px] text-outline" style={{ fontVariationSettings: "'wght' 200" }}>
                        sell
                      </span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">{t("discount.noDiscounts")}</p>
                      <p className="text-on-surface-variant text-sm max-w-xs">
                        {t("discount.createDiscount")}
                      </p>
                      <button
                        onClick={() => setModal({ type: "create" })}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all mt-2"
                      >
                        {t("discount.createDiscount")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="px-card-padding py-4">
                      <button
                        onClick={() => handleView(d.id)}
                        className="font-medium text-sm text-on-surface hover:text-primary transition-colors text-left"
                      >
                        {d.name}
                      </button>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {d.type === "PERCENTAGE" ? t("common.percent") : t("common.price")}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="font-data-table text-data-table text-primary">
                        {d.type === "PERCENTAGE" ? formatPercent(d.value) : formatCurrency(d.value)}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="text-sm text-on-surface-variant">
                        {d.max_discount_amount ? formatCurrency(d.max_discount_amount) : "—"}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${d.active ? "bg-secondary" : "bg-outline"}`}
                        />
                        <span className="text-xs font-medium">{d.active ? t("common.active") : t("common.inactive")}</span>
                      </div>
                    </td>
                    <td className="px-card-padding py-4 text-right">
                      <span className="text-sm text-on-surface-variant font-data-table">
                        {d.products_affected}
                      </span>
                    </td>
                    <td className="px-card-padding py-4">
                      <span className="text-sm text-on-surface-variant">{formatDate(d.updated_at)}</span>
                    </td>
                    <td className="px-card-padding py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(d)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-colors"
                          title={t("common.edit")}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleActivate(d)}
                          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant transition-colors ${
                            d.active ? "text-yellow-400 hover:text-yellow-300" : "text-secondary hover:text-secondary"
                          }`}
                          title={d.active ? t("discount.deactivate") : t("discount.activate")}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {d.active ? "pause_circle" : "play_circle"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleAssignProducts(d)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-colors"
                          title={t("discount.assignProductsTooltip")}
                        >
                          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
                          title={t("discount.deleteTooltip")}
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
              {t("discount.showing")} <span className="text-on-surface font-semibold">{Math.min((page - 1) * size + 1, data.total)}-{Math.min(page * size, data.total)}</span> {t("discount.of")}{" "}
              <span className="text-on-surface font-semibold">{data.total}</span>
            </p>
            <div className="flex items-center gap-4">
              <span className="text-body-md text-on-surface-variant text-sm">
                {t("discount.page")} {page} {t("discount.of")} {data.pages}
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

      {/* Modals */}
      {modal.type === "details" && (
        <DiscountDetailsModal
          discountId={modal.discountId}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => {
            const d = discounts.find((x) => x.id === modal.discountId);
            if (d) setModal({ type: "edit", discount: d });
          }}
        />
      )}

      {(modal.type === "create" || modal.type === "edit") && (
        <DiscountSlideOver
          discount={modal.type === "edit" ? modal.discount : null}
          onClose={() => setModal({ type: "none" })}
          onSaved={handleSaved}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {modal.type === "delete" && (
        <ConfirmDialog
          title={t("discount.deleteConfirmTitle")}
          message={t("discount.deleteConfirmMessage", { name: modal.discount.name })}
          confirmLabel={t("common.delete")}
          variant="danger"
          onConfirm={() => confirmDelete(modal.discount)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "activate" && (
        <ConfirmDialog
          title={modal.discount.active ? t("discount.deactivateConfirmTitle") : t("discount.activateConfirmTitle")}
          message={
            modal.discount.active
              ? t("discount.deactivateConfirmMessage", { name: modal.discount.name })
              : t("discount.activateConfirmMessage", { name: modal.discount.name })
          }
          confirmLabel={modal.discount.active ? t("discount.deactivate") : t("discount.activate")}
          variant="warning"
          onConfirm={() => confirmActivate(modal.discount)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "assign-products" && (
        <AssignProductsModal
          discountId={modal.discount.id}
          discountName={modal.discount.name}
          onClose={() => setModal({ type: "none" })}
          onAssigned={handleProductsAssigned}
        />
      )}

      {/* Toasts */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
