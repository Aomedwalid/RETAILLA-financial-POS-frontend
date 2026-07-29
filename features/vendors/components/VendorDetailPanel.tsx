"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { VendorResponse, VendorOverview, PurchaseOrderResponse, BillResponse, OutstandingBill } from "@/features/vendors/types";
import { vendorsApi } from "@/features/vendors/api";
import VendorOverviewTab from "./VendorOverviewTab";
import VendorPOTab from "./VendorPOTab";
import VendorBillsTab from "./VendorBillsTab";
import DeactivateVendor from "./DeactivateVendor";

interface VendorDetailPanelProps {
  vendor: VendorResponse;
  onClose: () => void;
  onUpdated: () => void;
  onUploadReceipt: (vendorId: string, vendorName: string) => void;
  onManualReceipt: (vendorId: string, vendorName: string) => void;
}

export default function VendorDetailPanel({ vendor, onClose, onUpdated, onUploadReceipt, onManualReceipt }: VendorDetailPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"overview" | "pos" | "bills">("overview");
  const [overview, setOverview] = useState<VendorOverview | null>(null);
  const [pos, setPos] = useState<PurchaseOrderResponse[]>([]);
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [outstandingBills, setOutstandingBills] = useState<OutstandingBill[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    if (tab !== "overview") return;
    setLoadingOverview(true);
    Promise.all([
      vendorsApi.getOverview(vendor.id),
      vendorsApi.listOutstandingBills(),
    ]).then(([ov, ob]) => {
      setOverview(ov);
      setOutstandingBills(ob.filter((b) => b.vendor_id === vendor.id));
    }).catch(() => {}).finally(() => setLoadingOverview(false));
  }, [tab, vendor.id]);

  useEffect(() => {
    if (tab !== "pos") return;
    vendorsApi.listPOs(vendor.id).then(setPos).catch(() => setPos([]));
  }, [tab, vendor.id]);

  useEffect(() => {
    if (tab !== "bills") return;
    vendorsApi.listVendorBills(vendor.id).then(setBills).catch(() => setBills([]));
  }, [tab, vendor.id]);

  const tabs = [
    { key: "overview" as const, label: t("vendorDetail.overview") },
    { key: "pos" as const, label: t("vendorDetail.purchaseOrders") },
    { key: "bills" as const, label: t("vendorDetail.bills") },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 py-4 border-b border-outline-variant bg-surface-container flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{vendor.name}</h3>
          <p className="text-[11px] text-on-surface-variant truncate">
            {vendor.contact_email || vendor.contact_phone
              ? `${vendor.contact_email || ""} ${vendor.contact_phone || ""}`.trim()
              : t("vendor.noContactInfo")}
          </p>
        </div>
        <DeactivateVendor vendorId={vendor.id} onDone={onUpdated} />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUploadReceipt(vendor.id, vendor.name)}
            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">upload_file</span>
            {t("receipt.upload")}
          </button>
          <button
            onClick={() => onManualReceipt(vendor.id, vendor.name)}
            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">edit_note</span>
            {t("receipt.manual")}
          </button>
        </div>
      </div>

      <div className="shrink-0 flex border-b border-outline-variant px-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tab === "overview" && (
          <VendorOverviewTab vendor={vendor} overview={overview} loading={loadingOverview} outstandingBills={outstandingBills} />
        )}
        {tab === "pos" && (
          <VendorPOTab vendorId={vendor.id} vendorName={vendor.name} pos={pos} onUpdated={() => vendorsApi.listPOs(vendor.id).then(setPos)} />
        )}
        {tab === "bills" && (
          <VendorBillsTab vendorId={vendor.id} bills={bills} onUpdated={() => vendorsApi.listVendorBills(vendor.id).then(setBills)} />
        )}
      </div>
    </div>
  );
}
