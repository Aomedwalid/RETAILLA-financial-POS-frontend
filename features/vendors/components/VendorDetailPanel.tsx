"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VendorResponse } from "@/features/vendors/types";
import VendorOverviewTab from "./VendorOverviewTab";
import VendorPOTab from "./VendorPOTab";
import VendorBillsTab from "./VendorBillsTab";
import StatementTab from "./StatementTab";
import DeactivateVendor from "./DeactivateVendor";

interface VendorDetailPanelProps {
  vendor: VendorResponse;
  onClose: () => void;
  onUpdated: () => void;
  onUploadReceipt: (vendorId: string, vendorName: string) => void;
  onManualReceipt: (vendorId: string, vendorName: string) => void;
  onLedgerImport: (vendorId: string, vendorName: string) => void;
}

export default function VendorDetailPanel({ vendor, onClose, onUpdated, onUploadReceipt, onManualReceipt, onLedgerImport }: VendorDetailPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"overview" | "pos" | "bills" | "statement">("overview");

  const tabs = [
    { key: "overview" as const, label: t("vendorDetail.overview") },
    { key: "pos" as const, label: t("vendorDetail.purchaseOrders") },
    { key: "bills" as const, label: t("vendorDetail.bills") },
    { key: "statement" as const, label: t("vendorStatement.title") },
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
          <button
            onClick={() => onLedgerImport(vendor.id, vendor.name)}
            className="px-3 py-1.5 rounded-lg border border-outline/30 text-on-surface-variant text-[10px] font-bold hover:bg-surface-variant transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
            {t("ledgerImport.title")}
          </button>
        </div>
      </div>

      <div className="shrink-0 flex border-b border-outline-variant px-5 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              tab === item.key ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-surface-variant"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tab === "overview" && <VendorOverviewTab vendor={vendor} />}
        {tab === "pos" && <VendorPOTab vendorId={vendor.id} vendorName={vendor.name} />}
        {tab === "bills" && <VendorBillsTab vendorId={vendor.id} />}
        {tab === "statement" && <StatementTab vendorId={vendor.id} />}
      </div>
    </div>
  );
}