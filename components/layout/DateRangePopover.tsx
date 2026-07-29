"use client";

import { useState, useRef, useCallback } from "react";
import { useDateRange } from "@/lib/filters/DateRangeContext";
import { presets } from "@/lib/filters/dateRangePresets";
import useClickOutside from "@/lib/hooks/useClickOutside";
import { useTranslation } from "react-i18next";

export default function DateRangePopover() {
  const { t } = useTranslation();
  const { startDate, endDate, presetLabel, displayLabel, setRange } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [customError, setCustomError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, isOpen, close);

  function toggle() {
    setIsOpen((p) => {
      if (!p) {
        setCustomStart(startDate);
        setCustomEnd(endDate);
        setCustomError("");
      }
      return !p;
    });
  }

  function applyPreset(ps: string, pe: string) {
    setRange(ps, pe);
    close();
  }

  function applyCustom() {
    setCustomError("");
    if (!customStart || !customEnd) {
      setCustomError(t("common.bothDatesRequired"));
      return;
    }
    if (customEnd < customStart) {
      setCustomError(t("common.endDateAfterStart"));
      return;
    }
    setRange(customStart, customEnd);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors"
      >
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          calendar_today
        </span>
        <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap">
          {presetLabel ? t(presetLabel) : displayLabel}
        </span>
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-72 glass-card rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              {t("common.presets")}
            </p>
          </div>

          <div className="py-1">
            {presets.map((p) => {
              const { startDate: ps, endDate: pe } = p.compute();
              const isActive = ps === startDate && pe === endDate;
              return (
                <button
                  key={p.labelKey}
                  onClick={() => applyPreset(ps, pe)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span>{t(p.labelKey)}</span>
                  {isActive && (
                    <span className="material-symbols-outlined text-lg">check</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-outline-variant" />

          <div className="px-4 py-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-3">
              {t("common.customRange")}
            </p>
            <div className="flex flex-col gap-2.5">
              <label className="text-xs text-on-surface-variant">{t("common.startDate")}</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors"
              />
              <label className="text-xs text-on-surface-variant">{t("common.endDate")}</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {customError && (
              <p className="text-xs text-error mt-2">{customError}</p>
            )}

            <button
              onClick={applyCustom}
              className="w-full mt-3 h-9 rounded-lg bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all"
            >
              {t("common.apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
