import { useState } from "react";
import { useTranslation } from "react-i18next";
import { vendorsApi } from "@/features/vendors/api";

interface DeactivateVendorProps {
  vendorId: string;
  onDone: () => void;
}

export default function DeactivateVendor({ vendorId, onDone }: DeactivateVendorProps) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="px-3 py-1.5 rounded-lg border border-error/30 text-error text-[10px] font-bold hover:bg-error/10 transition-colors">
        {t("vendor.deactivate")}
      </button>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      await vendorsApi.deactivate(vendorId);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendor.failedToDeactivate"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-error">{error || t("vendor.deactivateConfirmText")}</span>
      <button onClick={handleConfirm} disabled={loading} className="px-3 py-1.5 rounded-lg bg-error text-on-error text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
        {loading && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
        {t("common.yes")}
      </button>
      <button onClick={() => setConfirm(false)} className="px-3 py-1.5 rounded-lg border border-outline-variant text-[10px] text-on-surface-variant">{t("common.no")}</button>
    </div>
  );
}