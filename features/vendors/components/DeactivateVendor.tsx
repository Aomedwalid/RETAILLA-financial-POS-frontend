"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeactivateVendor } from "@/features/vendors/hooks";
import Toast from "@/components/ui/Toast";

interface DeactivateVendorProps {
  vendorId: string;
  onDone: () => void;
}

export default function DeactivateVendor({ vendorId, onDone }: DeactivateVendorProps) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const deactivateMutation = useDeactivateVendor();

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="px-3 py-1.5 rounded-lg border border-error/30 text-error text-[10px] font-bold hover:bg-error/10 transition-colors">
        {t("vendor.deactivate")}
      </button>
    );
  }

  async function handleConfirm() {
    deactivateMutation.mutate(vendorId, {
      onSuccess: () => {
        setToast({ message: t("vendor.deactivateSuccess"), type: "success" });
        onDone();
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : t("vendor.failedToDeactivate");
        setToast({ message: msg, type: "error" });
      },
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-error">{toast?.type === "error" ? toast.message : t("vendor.deactivateConfirmText")}</span>
        <button onClick={handleConfirm} disabled={deactivateMutation.isPending} className="px-3 py-1.5 rounded-lg bg-error text-on-error text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
          {deactivateMutation.isPending && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
          {t("common.yes")}
        </button>
        <button onClick={() => setConfirm(false)} className="px-3 py-1.5 rounded-lg border border-outline-variant text-[10px] text-on-surface-variant">{t("common.no")}</button>
      </div>
      {toast && toast.type === "success" && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}