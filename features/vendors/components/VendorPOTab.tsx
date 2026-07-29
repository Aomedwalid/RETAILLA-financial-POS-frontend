"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PurchaseOrderResponse, BillResponse, ConfirmReceiptResponse } from "@/features/vendors/types";
import { fmt } from "@/features/vendors/types";
import { vendorsApi } from "@/features/vendors/api";
import { productsApi } from "@/features/products/api";
import { formatDate } from "./utils";
import StatusBadge from "./StatusBadge";
import CreatePurchaseOrderModal from "./CreatePurchaseOrderModal";
import type { LineForm } from "./CreatePurchaseOrderModal";

interface POTabProps {
  vendorId: string;
  vendorName: string;
  pos: PurchaseOrderResponse[];
  onUpdated: () => void;
}

let _idCounter = 0;
function uid() { return `pof_${++_idCounter}`; }

export default function POTab({ vendorId, vendorName, pos, onUpdated }: POTabProps) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingPO, setViewingPO] = useState<{
    lines: LineForm[];
    billReference: string;
    dueDate: string;
    notes: string;
    readOnly: boolean;
  } | null>(null);

  const [allBills, setAllBills] = useState<BillResponse[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [productVariants, setProductVariants] = useState<Record<string, { attributes: Record<string, string> }>>({});
  const [productFields, setProductFields] = useState<Record<string, { price: string; cost: string; category_id: string; discount_id: string; low_stock_threshold: string; internal_notes: string }>>({});

  useEffect(() => {
    vendorsApi.listVendorBills(vendorId).then(setAllBills).catch(() => {});
  }, [vendorId, pos]);

  useEffect(() => {
    const variantIds = new Set<string>();
    for (const po of pos) {
      for (const line of po.lines) variantIds.add(line.variant_id);
    }
    if (variantIds.size === 0) return;
    productsApi.list({ size: 1000 }).then((res) => {
      const names: Record<string, string> = {};
      const vattrs: Record<string, { attributes: Record<string, string> }> = {};
      const fields: Record<string, { price: string; cost: string; category_id: string; discount_id: string; low_stock_threshold: string; internal_notes: string }> = {};
      for (const p of res.items) {
        if (p.variants) {
          for (const v of p.variants) {
            if (variantIds.has(v.id)) {
              names[v.id] = p.name;
              vattrs[v.id] = { attributes: v.attributes as Record<string, string> };
              fields[v.id] = {
                price: String(p.price ?? ""),
                cost: String(p.cost ?? ""),
                category_id: p.category_id ?? "",
                discount_id: p.discount_id ?? "",
                low_stock_threshold: String(p.low_stock_threshold ?? ""),
                internal_notes: p.internal_notes ?? "",
              };
            }
          }
        }
      }
      setProductNames(names);
      setProductVariants(vattrs);
      setProductFields(fields);
    }).catch(() => {});
  }, [pos]);

  function buildLineForm(po: PurchaseOrderResponse): LineForm[] {
    return po.lines.map((l) => {
      const pname = productNames[l.variant_id] || l.variant_id.slice(0, 12) + "...";
      const vattrs = productVariants[l.variant_id]?.attributes;
      const attrs: { key: string; value: string }[] = vattrs
        ? Object.entries(vattrs).map(([k, v]) => ({ key: k, value: String(v) }))
        : [];
      const pf = productFields[l.variant_id];
      return {
        id: uid(),
        raw_name: "",
        product_name: pname,
        is_variant_group: Object.keys(vattrs ?? {}).length > 0,
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

  function handleCreateDone(result: ConfirmReceiptResponse) {
    setShowCreateModal(false);
    setViewingPO(null);
    onUpdated();
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

      {pos.length === 0 ? (
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
                      {fmt(total)}
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
                    {po.notes && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-outline/40" />
                        <span className="truncate max-w-[140px]">{po.notes}</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    {po.lines.slice(0, 3).map((line, lni) => {
                      const pname = productNames[line.variant_id];
                      return (
                        <div key={lni} className="flex items-center justify-between text-[11px]">
                          <span className="text-on-surface-variant truncate max-w-[220px]">
                            {pname || line.variant_id.slice(0, 12) + "..."}
                          </span>
                          <span className="text-outline shrink-0 ml-2">
                            {line.quantity} &times; {fmt(line.unit_cost)}
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
          onDone={handleCreateDone}
        />
      )}

      {viewingPO && (
        <CreatePurchaseOrderModal
          vendorId={vendorId}
          vendorName={vendorName}
          onClose={() => setViewingPO(null)}
          onDone={handleCreateDone}
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
