export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DatePreset {
  labelKey: string;
  compute: () => DateRange;
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

export function todayStr(): string {
  return toDateString(startOfToday());
}

export function daysAgoStr(days: number): string {
  return toDateString(shiftDays(startOfToday(), -days));
}

export function startOfWeekStr(): string {
  const today = startOfToday();
  const weekday = today.getDay();
  return toDateString(shiftDays(today, weekday === 0 ? -6 : -(weekday - 1)));
}

export function firstOfMonthStr(): string {
  const today = startOfToday();
  return toDateString(new Date(today.getFullYear(), today.getMonth(), 1));
}

export function firstOfLastMonthStr(): string {
  const today = startOfToday();
  return toDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1));
}

export function lastNDays(days: number): DateRange {
  return {
    startDate: daysAgoStr(days - 1),
    endDate: todayStr(),
  };
}

export function defaultDateRange(): DateRange {
  return lastNDays(30);
}

export const presets: DatePreset[] = [
  { labelKey: "date.presets.today", compute: () => lastNDays(2) },
  { labelKey: "date.presets.last7Days", compute: () => lastNDays(7) },
  { labelKey: "date.presets.last30Days", compute: () => lastNDays(30) },
  { labelKey: "date.presets.last90Days", compute: () => lastNDays(90) },
  { labelKey: "date.presets.thisMonth", compute: () => ({ startDate: firstOfMonthStr(), endDate: todayStr() }) },
  {
    labelKey: "date.presets.lastMonth",
    compute: () => {
      const today = startOfToday();
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toDateString(first), endDate: toDateString(last) };
    },
  },
  {
    labelKey: "date.presets.yearToDate",
    compute: () => {
      const today = startOfToday();
      return { startDate: toDateString(new Date(today.getFullYear(), 0, 1)), endDate: todayStr() };
    },
  },
];

export function findMatchingPreset(startDate: string, endDate: string): string | null {
  for (const preset of presets) {
    const range = preset.compute();
    if (range.startDate === startDate && range.endDate === endDate) return preset.labelKey;
  }
  return null;
}

export function formatShortLabel(startDate: string, endDate: string): string {
  const from = new Date(`${startDate}T00:00:00`);
  const to = new Date(`${endDate}T00:00:00`);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${from.toLocaleDateString("ar-EG", options)} – ${to.toLocaleDateString("ar-EG", options)}`;
}
