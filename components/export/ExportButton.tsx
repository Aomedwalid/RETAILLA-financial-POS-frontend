"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ExcelColumn } from "@/lib/excel";
import Toast from "@/components/ui/Toast";
import ExportModal from "./ExportModal";

export type { ExcelColumn };

interface PaginatedFetchResult<T> {
  items: T[];
  total: number;
}

export interface ExportButtonProps<T> {
  columns: ExcelColumn<T>[];
  fetchPage: (page: number, size: number) => Promise<PaginatedFetchResult<T>>;
  fileName: string;
  sheetName?: string;
  batchSize?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function ExportButton<T>({
  columns,
  fetchPage,
  fileName,
  sheetName,
  batchSize = 100,
  className,
  label,
  disabled,
}: ExportButtonProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleExported = useCallback(
    (count: number) => {
      setOpen(false);
      setToast({ message: t("export.success", { count }), type: "success" });
    },
    [t]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={
          className ??
          "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors font-bold text-sm"
        }
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        {label ?? t("common.export")}
      </button>

      {open && (
        <ExportModal
          columns={columns}
          fetchPage={fetchPage}
          fileName={fileName}
          sheetName={sheetName}
          batchSize={batchSize}
          onClose={() => setOpen(false)}
          onExported={handleExported}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
