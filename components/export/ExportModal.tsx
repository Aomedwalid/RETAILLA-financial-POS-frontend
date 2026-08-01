"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  buildFileName,
  buildWorkbook,
  downloadBlob,
  type ExcelColumn,
} from "@/lib/excel";

interface PaginatedFetchResult<T> {
  items: T[];
  total: number;
}

interface ExportModalProps<T> {
  columns: ExcelColumn<T>[];
  fetchPage: (page: number, size: number) => Promise<PaginatedFetchResult<T>>;
  fileName: string;
  sheetName?: string;
  batchSize: number;
  onClose: () => void;
  onExported: (count: number) => void;
}

type ExportPhase = "loading-total" | "done" | "exporting" | "generating" | "downloading";

interface ExportProgress {
  current: number;
  total: number;
}

export default function ExportModal<T>({
  columns,
  fetchPage,
  fileName,
  sheetName,
  batchSize,
  onClose,
  onExported,
}: ExportModalProps<T>) {
  const { t } = useTranslation();
  const [total, setTotal] = useState<number | null>(null);
  const [countText, setCountText] = useState("");
  const [phase, setPhase] = useState<ExportPhase>("loading-total");
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState("");

  const applyTotalResult = useCallback((result: PaginatedFetchResult<T>) => {
    setTotal(result.total);
    setCountText(String(result.total));
    setPhase("done");
  }, []);

  const applyTotalError = useCallback(() => {
    setTotal(null);
    setPhase("done");
    setError(t("export.failedToLoad"));
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    fetchPage(1, 1)
      .then((result) => {
        if (!cancelled) applyTotalResult(result);
      })
      .catch(() => {
        if (!cancelled) applyTotalError();
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, applyTotalResult, applyTotalError]);

  function handleRetry() {
    setError("");
    setPhase("loading-total");
    fetchPage(1, 1).then(applyTotalResult).catch(applyTotalError);
  }

  function isBusy(): boolean {
    return phase === "exporting" || phase === "generating" || phase === "downloading";
  }

  async function runExport(requested: number) {
    setError("");
    const pages = Math.max(1, Math.ceil(requested / batchSize));
    setPhase("exporting");
    setProgress({ current: 1, total: pages });

    const rows: T[] = [];
    try {
      let page = 1;
      while (rows.length < requested) {
        setProgress({ current: page, total: pages });
        const result = await fetchPage(page, batchSize);
        rows.push(...result.items.slice(0, requested - rows.length));
        if (result.items.length === 0) break;
        page += 1;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setPhase("generating");
      const data = rows.map((row) => columns.map((column) => column.value(row)));
      const buffer = await buildWorkbook(columns, data, sheetName);

      setPhase("downloading");
      downloadBlob(buffer, buildFileName(fileName));
      onExported(rows.length);
    } catch {
      setPhase("done");
      setProgress(null);
      setError(t("common.somethingWentWrong"));
    }
  }

  function handleExport() {
    if (total === null) return;
    const count = parseInt(countText, 10);
    if (isNaN(count) || count < 1 || count > total) {
      setError(t("export.invalidCount", { total }));
      return;
    }
    void runExport(count);
  }

  const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">download</span>
            {t("export.title")}
          </h3>
          <button
            onClick={onClose}
            disabled={isBusy()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant disabled:opacity-40"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {phase === "loading-total" ? (
            <div className="flex items-center justify-center gap-3 py-8 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              <span className="text-sm">{t("export.loading")}</span>
            </div>
          ) : total === null ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex items-center gap-2 text-sm text-error">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                {t("common.retry")}
              </button>
            </div>
          ) : total === 0 ? (
            <div className="py-6 text-center text-sm text-on-surface-variant">{t("export.noRecords")}</div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <span className="text-sm text-on-surface-variant">{t("export.records")}</span>
                <span className="font-data-table text-lg font-bold text-primary">{total}</span>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">
                  {t("export.rowsLabel")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={total}
                  value={countText}
                  onChange={(e) => setCountText(e.target.value)}
                  disabled={isBusy()}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {isBusy() && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>
                      {phase === "exporting"
                        ? t("export.fetchingPage", {
                            current: progress?.current,
                            total: progress?.total,
                          })
                        : phase === "generating"
                          ? t("export.generating")
                          : t("export.downloading")}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {phase !== "loading-total" && (
          <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3">
            {total !== null && total !== 0 && (
              <button
                onClick={() => void runExport(total)}
                disabled={isBusy()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors text-sm font-bold disabled:opacity-50"
              >
                {t("export.exportAll")}
              </button>
            )}
            {total !== null && total !== 0 && (
              <button
                onClick={handleExport}
                disabled={isBusy()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                {t("common.export")}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isBusy()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
