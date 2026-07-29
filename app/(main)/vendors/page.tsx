"use client";

import { useState, useCallback } from "react";
import { useVendors } from "@/features/vendors/hooks";
import { vendorsApi } from "@/features/vendors/api";
import type { VendorResponse, PendingReceiptState, ReviewLineState, ConfirmedReceiptLine } from "@/features/vendors/types";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { getBalance } from "@/features/vendors/components/utils";

function makeEmptyLine(): ReviewLineState {
  return {
    raw_name: "",
    product_name: "",
    is_variant_group: false,
    matched_product_id: null,
    is_new_product: true,
    variants: [{ attributes: {}, quantity: 1 }],
    price: "",
    cost: "",
    description: "",
    category_id: "",
    discount_id: "",
    low_stock_threshold: "",
    internal_notes: "",
  };
}
import VendorList from "@/features/vendors/components/VendorList";
import StatCards from "@/features/vendors/components/StatCards";
import {
  DynamicCreateVendorModal,
  DynamicVendorDetailPanel,
  DynamicOutstandingBillsWidget,
  DynamicReceiptIngestionModal,
  DynamicPendingReceiptBubble,
} from "@/lib/lazy-modals";

function makeEmptyReceipt(vendorId: string, vendorName: string): PendingReceiptState {
  return {
    vendorId,
    vendorName,
    source: null,
    lines: [],
    totalCost: 0,
    extractionNotes: null,
    billReference: "",
    dueDate: "",
    notes: "",
    newProductsCount: 0,
  };
}

export default function VendorsPage() {
  const { t } = useTranslation();
  const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(null);

  // Pending receipt state (persists across screen closes)
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceiptState | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const vendorsQ = useVendors();
  const vendors = vendorsQ.data ?? [];
  const loading = vendorsQ.isLoading;
  const error = vendorsQ.error ? (vendorsQ.error instanceof Error ? vendorsQ.error.message : "Failed to load vendors") : "";

  const handleUploadReceipt = useCallback((vendorId: string, vendorName: string) => {
    setPendingReceipt(makeEmptyReceipt(vendorId, vendorName));
    setShowReceiptModal(true);
  }, []);

  const handleManualReceipt = useCallback((vendorId: string, vendorName: string) => {
    setPendingReceipt({
      ...makeEmptyReceipt(vendorId, vendorName),
      source: "manual",
      lines: [makeEmptyLine()],
    });
    setShowReceiptModal(true);
  }, []);

  const handleReceiptUpdate = useCallback((patch: Partial<PendingReceiptState>) => {
    setPendingReceipt((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  const handleReceiptConfirm = useCallback(async () => {
    if (!pendingReceipt) return;
    const { vendorId, lines, billReference, dueDate, notes } = pendingReceipt;
    const payload = {
      lines: lines.map((l) => {
        const threshold = parseInt(l.low_stock_threshold, 10);
        const line: ConfirmedReceiptLine = {
          raw_name: l.raw_name,
          product_name: l.product_name,
          is_variant_group: l.is_variant_group,
          matched_product_id: l.matched_product_id,
          variants: l.variants.map((v) => ({
            attributes: v.attributes,
            quantity: v.quantity ?? 1,
          })),
          price: parseFloat(l.price) || 0,
          cost: parseFloat(l.cost) || 0,
          description: l.description.trim() || "",
          category_id: l.category_id.trim() || null,
          discount_id: l.discount_id.trim() || null,
          low_stock_threshold: !isNaN(threshold) && threshold > 0 ? threshold : 0,
          internal_notes: l.internal_notes.trim() || "",
        };
        return line;
      }),
      bill_reference: billReference.trim() || "",
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      notes: notes.trim() || "",
    };

    if (pendingReceipt.source === "manual") {
      await vendorsApi.manualReceipt(vendorId, payload);
    } else {
      await vendorsApi.confirmReceipt(vendorId, payload);
    }
  }, [pendingReceipt]);

  const handleReceiptClose = useCallback(() => {
    setShowReceiptModal(false);
    // Do NOT clear pendingReceipt — it persists as a draft
  }, []);

  const handleReceiptDone = useCallback(() => {
    setPendingReceipt(null);
    setShowReceiptModal(false);
    vendorsQ.refetch();
  }, [vendorsQ]);

  const totalOutstanding = vendors.reduce((s, v) => s + getBalance(v), 0);
  const withBalance = vendors.filter((v) => getBalance(v) > 0).length;

  const hasPending = pendingReceipt !== null && !showReceiptModal;

  return (
    <div className="flex h-full relative">
      {/* ── Left: Vendor List ── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedVendor ? "hidden lg:flex lg:w-1/2" : ""}`}>
        <div className="shrink-0 px-container-margin pt-6 pb-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-headline-md font-bold text-on-surface">{t("nav.vendors")}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {vendors.length} {t("vendor.active")} {vendors.length !== 1 ? "" : ""} &middot; {formatCurrency(totalOutstanding)} {t("vendor.outstandingBills")}
              </p>
            </div>
            <DynamicCreateVendorModal onCreated={() => vendorsQ.refetch()} />
          </div>

          <StatCards
            totalVendors={vendors.length}
            totalOutstanding={totalOutstanding}
            avgBalance={vendors.length ? totalOutstanding / vendors.length : 0}
            withBalance={withBalance}
          />

          {!selectedVendor && <DynamicOutstandingBillsWidget />}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-container-margin pb-6">
          <VendorList
            vendors={vendors}
            selectedId={selectedVendor?.id ?? null}
            onSelect={setSelectedVendor}
            loading={loading}
            error={error}
            onRetry={() => vendorsQ.refetch()}
          />
        </div>
      </div>

      {/* ── Right: Vendor Detail Panel ── */}
      {selectedVendor && (
        <div className="flex-1 lg:w-1/2 border-l border-outline-variant bg-surface flex flex-col min-w-0">
          <DynamicVendorDetailPanel
            vendor={selectedVendor}
            onClose={() => {
              setSelectedVendor(null);
              vendorsQ.refetch();
            }}
            onUpdated={() => {
              vendorsQ.refetch();
            }}
            onUploadReceipt={handleUploadReceipt}
            onManualReceipt={handleManualReceipt}
          />
        </div>
      )}

      {/* ── Receipt Modal (Upload / Review / Confirmed) ── */}
      {showReceiptModal && pendingReceipt && (
        <DynamicReceiptIngestionModal
          pendingReceipt={pendingReceipt}
          onUpdate={handleReceiptUpdate}
          onConfirm={handleReceiptConfirm}
          onClose={handleReceiptClose}
          onDone={handleReceiptDone}
        />
      )}

      {/* ── Pending Receipt Bubble ── */}
      {hasPending && (
        <DynamicPendingReceiptBubble
          vendorName={pendingReceipt.vendorName}
          lineCount={pendingReceipt.lines.length}
          onClick={() => setShowReceiptModal(true)}
        />
      )}
    </div>
  );
}
