"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useVendorPurchaseOrders, useVendorBills } from "@/features/vendors/hooks";
import { productsApi } from "@/features/products/api";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import type { PurchaseOrderResponse } from "@/features/vendors/types";
import { formatDate } from "./utils";
import StatusBadge from "./StatusBadge";
import CreatePurchaseOrderModal from "./CreatePurchaseOrderModal";
import type { LineForm } from "./CreatePurchaseOrderModal";
import { useReceivePO } from "@/features/vendors/hooks";

interface POTabProps {
  vendorId: string;
  vendorName: string;
}

let _idCounter = 0;
function uid() { return `pof_${++_idCounter}`; }

export default function VendorPOTab({ vendorId, vendorName }: POTabProps) {
  const { t } = useTranslation();
  const { data: pos = [], isLoading, isError, refetch: refetchPOs } = useVendorPurchaseOrders(vendorId);
  const { data: allBills = [] } = useVendorBills(vendorId);
  const receiveMutation = useReceivePO();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingPO, setViewingPO] = useState<{
    lines: LineForm[];
    billReference: string;
    dueDate: string;
    notes: string;
    readOnly: boolean;
  } | null>(null);

  const variantIds = useMemo(
    () => new Set(pos.flatMap((p) => p.lines.map((l) => l.variant_id))),
    [pos]
  );
  const { data: products } = useQuery({
    queryKey: queryKeys.products.list({ size: 1000 }),
    queryFn: () => productsApi.list({ size: 1000 }),
    enabled: variantIds.size > 0,
    staleTime: 60_000,
  });

  const variantMeta = useMemo(() => {
    const names = new Map<string, string>();
    const attrs = new Map<string, Record<string, string>>();
    const fields = new Map<string, { price: string; cost: string; category_id: string; discount_id: string; low_stock_threshold: string; internal_notes: string }>();
    for (const p of products?.items ?? []) {
      for (const v of p.variants) {
        names.set(v.id, p.name);
        attrs.set(v.id, (v.attributes as Record<string, string>) ?? {});
        fields.set(v.id, {
          price: String(p.price ?? ""),
          cost: String(p.cost ?? ""),
          category_id: p.category_id ?? "",
          discount_id: p.discount_id ?? "",
          low_stock_threshold: String(p.low_stock_threshold ?? ""),
          internal_notes: p.internal_notes ?? "",
        });
      }
    }
    return { names, attrs, fields };
  }, [products]);

  function buildLineForm(po: PurchaseOrderResponse): LineForm[] {
    return po.lines.map((l) => {
      const pname = variantMeta.names.get(l.variant_id) || l.variant_id.slice(0, 12) + "...";
      const vattrs = variantMeta.attrs.get(l.variant_id) ?? {};
      const attrs = Object.entries(vattrs).map(([k, v]) => ({ key: k, value: String(v) }));
      const pf = variantMeta.fields.get(l.variant_id);
      return {
        id: uid(),
        raw_name: "",
        product_name: pname,
        is_variant_group: Object.keys(vattrs).length > 0,
        matched_product_id: null,
        is_new_product: false,
        description: "",
        price: pf?.price ?? "",
        cost: pf?.cost ?? "",
        category_id: pf?.category_id ?? "",
        discount_id: pf?.discount_id ?? "",
        low_stock_threshold: pf?.low_stock_threshold ?? "",
        internal_notes: pf?.internal_notes ?? "",
        variants: [{
          id: uid(),
          attrs,
          quantity: l.quantity,
          unit_cost: parseFloat(l.unit_cost),
          price: "",
        }],
      };
    });
  }

  function handleViewPO(po: PurchaseOrderResponse) {
    const bill = allBills.find((b) => b.po_id === po.id);
    setViewingPO({
      lines: buildLineForm(po),
      billReference: bill?.bill_reference ?? "",
      dueDate: bill?.due_date ?? "",
      notes: po.notes ?? "",
      readOnly: true,
    });
  }

  const sortedPOs = [...pos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-on-surface-variant">
          {pos.length} {t("vendor.purchaseOrder", { count: pos.length })}
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-xs">add</span>
          {t("vendor.createPO")}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 rounded-xl bg-surface-container-highest/40" />
          <div className="h-24 rounded-xl bg-surface-container-highest/40" />
        </div>
      ) : pos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-outline">receipt_long</span>
          </div>
          <p className="text-sm font-medium text-on-surface-variant">{t("vendor.noPOs")}</p>
          <p className="text-xs text-outline mt-1 mb-6">{t("vendor.poEmptyHint")}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            {t("vendor.createPO")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPOs.map((po) => {
            const total = po.lines.reduce((s, l) => s + l.quantity * parseFloat(l.unit_cost), 0);
            const bill = allBills.find((b) => b.po_id === po.id);
            const lineCount = po.lines.length;
            const isReceived = po.status === "RECEIVED";
            return (
              <div
                key={po.id}
                onClick={() => handleViewPO(po)}
                className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-data-table text-xs text-on-surface font-semibold">
                        {bill?.bill_reference ? `#${bill.bill_reference}` : `#${po.id.slice(0, 8)}`}
                      </span>
                      <StatusBadge status={po.status} />
                      {!isReceived && (
                        <span className="text-[10px] text-[#d99c00] bg-[#d99c00]/10 px-1.5 py-0.5 rounded-full font-semibold">
                          {t("vendor.pending")}
                        </span>
                      )}
                    </div>
                    <span className="font-data-table text-sm font-bold text-on-surface shrink-0 ml-2">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-outline mb-3">
                    <span>{t("vendor.created")} {formatDate(po.created_at)}</span>
                    {bill?.due_date && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-outline/40" />
                        <span>{t("vendor.due")} {formatDate(bill.due_date)}</span>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-outline/40" />
                    <span>{lineCount} {t("vendor.product", { count: lineCount })}</span>
                    {bill?.bill_reference && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-outline/40" />
                        <span>{t("vendor.ref")}: {bill.bill_reference}</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    {po.lines.slice(0, 3).map((line, lni) => {
                      const pname = variantMeta.names.get(line.variant_id);
                      return (
                        <div key={lni} className="flex items-center justify-between text-[11px]">
                          <span className="text-on-surface-variant truncate max-w-[220px]">
                            {pname || line.variant_id.slice(0, 12) + "..."}
                          </span>
                          <span className="text-outline shrink-0 ml-2">
                            {line.quantity} &times; {formatCurrency(line.unit_cost)}
                          </span>
                        </div>
                      );
                    })}
                    {lineCount > 3 && (
                      <p className="text-[10px] text-outline italic">+{lineCount - 3} {t("vendor.more")}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
                    <span className="text-[10px] text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">visibility</span>
                      {t("vendor.clickToView")}
                    </span>
                    {po.status === "PENDING" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); receiveMutation.mutate({ vendorId, poId: po.id }); }}
                        disabled={receiveMutation.isPending}
                        className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">inventory_2</span>
                        {receiveMutation.isPending ? t("vendor.receiving") : t("vendor.receive")}
                      </button>
                    )}
                    {isReceived && bill && (
                      <span className="text-[10px] text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        {t("vendor.billAttached")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreatePurchaseOrderModal
          vendorId={vendorId}
          vendorName={vendorName}
          onClose={() => setShowCreateModal(false)}
          onDone={() => { setShowCreateModal(false); refetchPOs(); }}
        />
      )}

      {viewingPO && (
        <CreatePurchaseOrderModal
          vendorId={vendorId}
          vendorName={vendorName}
          onClose={() => setViewingPO(null)}
          onDone={() => setViewingPO(null)}
          initialLines={viewingPO.lines}
          initialBillReference={viewingPO.billReference}
          initialDueDate={viewingPO.dueDate}
          initialNotes={viewingPO.notes}
          readOnly={viewingPO.readOnly}
        />
      )}
    </div>
  );
}