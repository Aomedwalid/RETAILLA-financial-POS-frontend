import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-[#d99c00]/10 text-[#d99c00] border-[#d99c00]/20",
  RECEIVED: "bg-secondary/10 text-secondary border-secondary/20",
  UNPAID: "bg-outline/10 text-outline border-outline/20",
  PARTIALLY_PAID: "bg-[#d99c00]/10 text-[#d99c00] border-[#d99c00]/20",
  PAID: "bg-secondary/10 text-secondary border-secondary/20",
  OVERDUE: "bg-error/10 text-error border-error/20",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { t } = useTranslation();
  const base = statusStyles[status] || "bg-outline/10 text-outline border-outline/20";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  const statusLabels: Record<string, string> = {
    PENDING: t("vendor.pending"),
    RECEIVED: t("vendor.status.received"),
    UNPAID: t("vendor.status.unpaid"),
    PARTIALLY_PAID: t("vendor.status.partial"),
    PAID: t("vendor.paid"),
    OVERDUE: t("vendor.overdue"),
  };

  return (
    <span className={`${textSize} font-bold px-2 py-0.5 rounded-full border ${base}`}>
      {statusLabels[status] || status}
    </span>
  );
}