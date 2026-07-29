export interface DatePreset {
  labelKey: string;
  compute: () => { startDate: string; endDate: string };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function tomorrow(): Date {
  const d = today();
  d.setDate(d.getDate() + 1);
  return d;
}

function daysAgo(n: number): Date {
  const d = today();
  d.setDate(d.getDate() - n);
  return d;
}

export const presets: DatePreset[] = [
  {
    labelKey: "date.presets.last7Days",
    compute: () => ({
      startDate: formatDate(daysAgo(6)),
      endDate: formatDate(tomorrow()),
    }),
  },
  {
    labelKey: "date.presets.last30Days",
    compute: () => ({
      startDate: formatDate(daysAgo(29)),
      endDate: formatDate(tomorrow()),
    }),
  },
  {
    labelKey: "date.presets.last90Days",
    compute: () => ({
      startDate: formatDate(daysAgo(89)),
      endDate: formatDate(tomorrow()),
    }),
  },
  {
    labelKey: "date.presets.thisMonth",
    compute: () => {
      const t = today();
      return {
        startDate: formatDate(new Date(t.getFullYear(), t.getMonth(), 1)),
        endDate: formatDate(tomorrow()),
      };
    },
  },
  {
    labelKey: "date.presets.lastMonth",
    compute: () => {
      const t = today();
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const last = new Date(t.getFullYear(), t.getMonth(), 0);
      return {
        startDate: formatDate(first),
        endDate: formatDate(tomorrow()),
      };
    },
  },
  {
    labelKey: "date.presets.yearToDate",
    compute: () => {
      const t = today();
      return {
        startDate: formatDate(new Date(t.getFullYear(), 0, 1)),
        endDate: formatDate(tomorrow()),
      };
    },
  },
];

export function findMatchingPreset(startDate: string, endDate: string): string | null {
  for (const p of presets) {
    const { startDate: ps, endDate: pe } = p.compute();
    if (ps === startDate && pe === endDate) return p.labelKey;
  }
  return null;
}

export function formatShortLabel(startDate: string, endDate: string): string {
  const d1 = new Date(startDate + "T00:00:00");
  const d2 = new Date(endDate + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${d1.toLocaleDateString("ar-EG", opts)} – ${d2.toLocaleDateString("ar-EG", opts)}`;
}

export function last30Days(): { startDate: string; endDate: string } {
  return {
    startDate: formatDate(daysAgo(29)),
    endDate: formatDate(today()),
  };
}
