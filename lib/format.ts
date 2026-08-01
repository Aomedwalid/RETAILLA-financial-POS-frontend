export function formatCurrency(value: number | string | null | undefined, showSymbol = true): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(n)) return showSymbol ? "٠٫٠٠ ج.م" : "٠٫٠٠";
  const formatted = n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return showSymbol ? `${formatted} ج.م` : formatted;
}

export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(n)) return (0).toLocaleString("ar-EG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%";
  return n.toLocaleString("ar-EG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%";
}

export function formatCurrencyShort(value: number | string | null | undefined): string {
  return formatCurrency(value);
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ar-EG");
}

export function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
