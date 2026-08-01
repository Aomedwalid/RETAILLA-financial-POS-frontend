"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { defaultDateRange, findMatchingPreset, formatShortLabel } from "./dateRangePresets";

interface DateRangeContextValue {
  startDate: string;
  endDate: string;
  presetLabel: string | null;
  displayLabel: string;
  setRange: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(`${value}T00:00:00`));
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramStart = searchParams.get("start") ?? "";
  const paramEnd = searchParams.get("end") ?? "";
  const hasValidParams = isValidDate(paramStart) && isValidDate(paramEnd);

  const initialRange = useMemo(
    () =>
      hasValidParams
        ? { startDate: paramStart, endDate: paramEnd }
        : defaultDateRange(),
    [hasValidParams, paramStart, paramEnd]
  );

  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  useEffect(() => {
    if (!hasValidParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", initialRange.startDate);
      params.set("end", initialRange.endDate);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [hasValidParams, initialRange, router, searchParams]);

  const setRange = useCallback(
    (start: string, end: string) => {
      const orderedStart = start <= end ? start : end;
      const orderedEnd = start <= end ? end : start;
      setStartDate(orderedStart);
      setEndDate(orderedEnd);
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", orderedStart);
      params.set("end", orderedEnd);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const presetLabel = useMemo(() => findMatchingPreset(startDate, endDate), [startDate, endDate]);
  const displayLabel = useMemo(
    () => presetLabel ?? formatShortLabel(startDate, endDate),
    [presetLabel, startDate, endDate]
  );

  return (
    <DateRangeContext.Provider value={{ startDate, endDate, presetLabel, displayLabel, setRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}
