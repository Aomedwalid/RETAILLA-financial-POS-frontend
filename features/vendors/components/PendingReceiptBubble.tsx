"use client";

import { useTranslation } from "react-i18next";

interface PendingReceiptBubbleProps {
  vendorName: string;
  lineCount: number;
  onClick: () => void;
}

export default function PendingReceiptBubble({ vendorName, lineCount, onClick }: PendingReceiptBubbleProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-6 right-6 z-40 animate-scale-in">
      <button
        onClick={onClick}
        className="group flex items-center gap-3 bg-primary text-on-primary rounded-full px-5 py-3 shadow-2xl hover:brightness-110 transition-all active:scale-95"
      >
        <div className="relative">
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight">{t("receipt.pendingReceipt")}</p>
          <p className="text-[10px] opacity-80 leading-tight">{vendorName} &middot; {lineCount} {t("vendor.line", { count: lineCount })}</p>
        </div>
        <span className="material-symbols-outlined text-sm opacity-60 group-hover:opacity-100 transition-opacity">chevron_left</span>
      </button>
    </div>
  );
}
