"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { last30Days, findMatchingPreset, formatShortLabel } from "./dateRangePresets";

interface DateRangeContextValue {
  startDate: string;
  endDate: string;
  presetLabel: string | null;
  displayLabel: string;
  setRange: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str + "T00:00:00"));
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaults = last30Days();

  const paramStart = searchParams.get("start") ?? "";
  const paramEnd = searchParams.get("end") ?? "";
  const hasValidParams = isValidDate(paramStart) && isValidDate(paramEnd);

  const [startDate, setStartDate] = useState(
    hasValidParams ? paramStart : defaults.startDate
  );
  const [endDate, setEndDate] = useState(
    hasValidParams ? paramEnd : defaults.endDate
  );

  useEffect(() => {
    if (!hasValidParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", startDate);
      params.set("end", endDate);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, []);

  const setRange = useCallback(
    (start: string, end: string) => {
      const s = end < start ? end : start;
      const e = end < start ? start : end;
      setStartDate(s);
      setEndDate(e);
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", s);
      params.set("end", e);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const presetLabel = useMemo(() => findMatchingPreset(startDate, endDate), [startDate, endDate]);
  const displayLabel = useMemo(() => presetLabel ?? formatShortLabel(startDate, endDate), [presetLabel, startDate, endDate]);

  return (
    <DateRangeContext.Provider value={{ startDate, endDate, presetLabel, displayLabel, setRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}
