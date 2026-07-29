"use client";

import { useTranslation } from "react-i18next";

const rankConfig: Record<string, { color: string; labelKey: string }> = {
  bronze: { color: "bg-amber-600/20 text-amber-400 border-amber-600/30", labelKey: "customer.rank.bronze" },
  silver: { color: "bg-slate-400/20 text-slate-300 border-slate-400/30", labelKey: "customer.rank.silver" },
  gold: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", labelKey: "customer.rank.gold" },
  platinum: { color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", labelKey: "customer.rank.platinum" },
  vip: { color: "bg-purple-500/20 text-purple-300 border-purple-500/30", labelKey: "customer.rank.vip" },
};

export default function CustomerRankBadge({ rank }: { rank: string }) {
  const { t } = useTranslation();
  const key = rank?.toLowerCase() ?? "";
  const config = rankConfig[key];
  if (config) {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.color}`}>
        {t(config.labelKey)}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-surface-variant/30 text-on-surface-variant border-outline-variant">
      {rank || "—"}
    </span>
  );
}
