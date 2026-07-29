interface ProgressBarProps {
  paid: string | number | null;
  total: string | number | null;
  status: string;
}

export default function ProgressBar({ paid, total, status }: ProgressBarProps) {
  const pPaid = paid == null ? 0 : (typeof paid === "string" ? parseFloat(paid) : paid);
  const pTotal = total == null ? 0 : (typeof total === "string" ? parseFloat(total) : total);
  const pct = pTotal > 0 ? Math.min(pPaid / pTotal, 1) : 0;
  const color = status === "PAID" ? "bg-secondary" : status === "OVERDUE" ? "bg-error" : pct > 0 ? "bg-[#d99c00]" : "bg-outline/30";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-outline/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-[10px] font-data-table text-outline min-w-[3rem] text-right">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}