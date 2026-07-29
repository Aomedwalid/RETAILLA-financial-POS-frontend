import { useTranslation } from "react-i18next";
import type { VendorResponse } from "@/features/vendors/types";
import { fmt } from "@/features/vendors/types";
import { getBalance } from "./utils";

interface VendorListProps {
  vendors: VendorResponse[];
  selectedId: string | null;
  onSelect: (v: VendorResponse) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export default function VendorList({ vendors, selectedId, onSelect, loading, error, onRetry }: VendorListProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 animate-pulse">
            <div className="h-4 w-32 rounded bg-surface-container-highest/60 mb-3" />
            <div className="h-3 w-24 rounded bg-surface-container-highest/40 mb-2" />
            <div className="h-3 w-20 rounded bg-surface-container-highest/40" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-[48px] text-error mb-3">error</span>
        <p className="text-sm text-error">{error}</p>
        <button onClick={onRetry} className="mt-4 px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold">{t("common.retry")}</button>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3">conveyor_belt</span>
        <p className="text-sm text-on-surface-variant">{t("vendor.noVendors")}</p>
        <p className="text-xs text-outline mt-1">{t("vendor.createFirstVendor")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {vendors.map((vendor) => {
        const bal = getBalance(vendor);
        return (
          <button
            key={vendor.id}
            onClick={() => onSelect(vendor)}
            className={`text-left bg-surface-container-low border rounded-xl p-5 hover:border-primary/30 hover:bg-surface-container transition-all ${
              selectedId === vendor.id ? "border-primary/40 bg-surface-container" : "border-outline-variant"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-surface text-sm truncate">{vendor.name}</p>
                {vendor.contact_name && <p className="text-[11px] text-on-surface-variant mt-0.5">{vendor.contact_name}</p>}
              </div>
              {bal > 0 && (
                <span className="shrink-0 ml-2 text-[11px] font-bold text-error font-data-table">{fmt(bal)}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-outline flex-wrap">
              {vendor.contact_email && <span className="truncate max-w-[160px]">{vendor.contact_email}</span>}
              {vendor.contact_phone && <span>{vendor.contact_phone}</span>}
              {vendor.payment_terms_days && <span>{vendor.payment_terms_days}{t("vendor.daysTerms")}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}