"use client";

import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Boxes,
  Calculator,
  CheckCircle2,
  Layers,
  Package,
  Percent,
  Store,
  Tags,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useProductsOverview } from "../hooks";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { ProductsOverview } from "../types";
import AnimatedNumber from "./overview/AnimatedNumber";
import Donut from "./overview/Donut";

const COLORS = {
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  error: "var(--color-error)",
  outlineVariant: "var(--color-outline-variant)",
  warning: "#ffb74d",
};

const fmtCount = (n: number) => formatNumber(Math.round(n));
const fmtMoney = (n: number) => formatCurrency(n);
const fmtPct = (decimals: number) => (n: number) => formatPercent(n, decimals);

function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function isEmpty(data: ProductsOverview): boolean {
  return (
    data.total_products === 0 &&
    data.active_products === 0 &&
    data.inactive_products === 0 &&
    data.in_stock_products === 0 &&
    data.out_of_stock_products === 0 &&
    data.low_stock_products === 0 &&
    data.total_units_in_stock === 0 &&
    Number(data.inventory_cost) === 0 &&
    Number(data.inventory_retail_value) === 0 &&
    Number(data.expected_gross_profit) === 0 &&
    Number(data.expected_profit_margin) === 0 &&
    Number(data.average_product_cost) === 0 &&
    Number(data.average_product_price) === 0
  );
}

function Skeleton() {
  return (
    <div className="space-y-stack-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-80 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="animate-scale-in rounded-2xl border border-outline-variant bg-surface-container-low transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-black/20"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-container-highest">
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  footer,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Card delay={delay}>
      <div className="p-5">
        <div className={`mb-4 inline-flex w-11 h-11 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="mt-1.5 font-data-table text-3xl font-bold leading-tight text-on-surface">{value}</p>
        {footer && <div className="mt-4 border-t border-outline-variant/40 pt-3">{footer}</div>}
      </div>
    </Card>
  );
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 font-data-table">
        <span className="font-semibold text-on-surface">{formatNumber(value)}</span>
        <span className="text-xs text-outline">{formatPercent(percentOf(value, total), 0)}</span>
      </span>
    </li>
  );
}

function DonutCard({
  icon,
  iconClass,
  title,
  segments,
  center,
  legend,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  segments: { value: number; color: string }[];
  center: React.ReactNode;
  legend: React.ReactNode;
  delay?: number;
}) {
  return (
    <Card delay={delay}>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
          <h3 className="font-label-caps text-label-caps text-on-surface">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-2">
          <Donut segments={segments}>{center}</Donut>
        </div>
        <ul className="mt-4 space-y-2.5">{legend}</ul>
      </div>
    </Card>
  );
}

function StatTile({
  icon,
  iconClass,
  label,
  value,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="animate-scale-in rounded-xl border border-outline-variant/60 bg-surface-container-low/60 p-4 transition-colors duration-300 hover:border-primary/25 hover:bg-surface-container-low"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
        <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <p className="font-data-table text-xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

function LowStockBanner({ count, onViewLowStock }: { count: number; onViewLowStock: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="animate-scale-in flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3.5"
      style={{ animationFillMode: "backwards" }}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
        <AlertTriangle size={18} />
      </span>
      <p className="min-w-[180px] flex-1 text-sm text-on-surface">{t("product.overview.lowStockBanner", { count })}</p>
      <button onClick={onViewLowStock} className="text-xs font-semibold text-primary hover:underline">
        {t("product.overview.viewProducts")}
      </button>
    </div>
  );
}

export default function InventoryOverviewTab({ onViewLowStock }: { onViewLowStock: () => void }) {
  const { t } = useTranslation();
  const { data, isLoading: loading, isError, refetch } = useProductsOverview();

  if (loading) return <Skeleton />;

  if (isError || !data) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined mb-3 text-[48px] text-error">error</span>
          <p className="text-body-md text-error">{t("product.overview.loadError")}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {t("common.retry")}
          </button>
        </div>
      </Card>
    );
  }

  if (isEmpty(data)) {
    return (
      <Card>
        <div className="flex items-center gap-4 p-6">
          <span className="material-symbols-outlined text-4xl text-primary/40">inventory_2</span>
          <p className="text-sm text-on-surface-variant">{t("product.overview.empty")}</p>
        </div>
      </Card>
    );
  }

  const {
    total_products,
    active_products,
    inactive_products,
    in_stock_products,
    out_of_stock_products,
    low_stock_products,
    total_units_in_stock,
    inventory_cost,
    inventory_retail_value,
    expected_gross_profit,
    expected_profit_margin,
    average_product_cost,
    average_product_price,
  } = data;

  const activeRate = percentOf(active_products, total_products);
  const inStockRate = percentOf(in_stock_products, total_products);
  const margin = Number(expected_profit_margin) || 0;

  return (
    <div className="space-y-stack-lg">
      {low_stock_products > 0 && <LowStockBanner count={low_stock_products} onViewLowStock={onViewLowStock} />}

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          delay={0}
          icon={<Package size={20} />}
          iconClass="bg-primary/15 text-primary"
          label={t("product.overview.totalProducts")}
          value={<AnimatedNumber value={total_products} format={fmtCount} />}
          footer={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">{t("product.overview.activeShort")}</span>
                <span className="font-data-table text-on-surface">
                  {formatNumber(active_products)} / {formatNumber(total_products)}
                </span>
              </div>
              <ProgressBar value={activeRate} color="bg-primary" />
            </div>
          }
        />

        <KpiCard
          delay={60}
          icon={<Layers size={20} />}
          iconClass="bg-secondary/15 text-secondary"
          label={t("product.overview.totalUnits")}
          value={<AnimatedNumber value={total_units_in_stock} format={fmtCount} />}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-on-surface-variant">{t("product.overview.lowStockProducts")}</span>
              <span className="flex items-center gap-1.5 font-data-table font-semibold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {formatNumber(low_stock_products)}
              </span>
            </div>
          }
        />

        <KpiCard
          delay={120}
          icon={<Store size={20} />}
          iconClass="bg-tertiary/15 text-tertiary"
          label={t("product.overview.inventoryValue")}
          value={<AnimatedNumber value={Number(inventory_retail_value) || 0} format={fmtMoney} />}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-on-surface-variant">{t("product.overview.costLabel")}</span>
              <span className="font-data-table text-on-surface">{formatCurrency(inventory_cost)}</span>
            </div>
          }
        />

        <KpiCard
          delay={180}
          icon={<Percent size={20} />}
          iconClass="bg-primary-fixed-dim/15 text-primary-fixed-dim"
          label={t("product.overview.profitMargin")}
          value={<AnimatedNumber value={margin} format={fmtPct(1)} />}
          footer={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">{t("product.overview.expectedProfit")}</span>
                <span className="font-data-table text-on-surface">{formatCurrency(expected_gross_profit)}</span>
              </div>
              <ProgressBar value={margin} color="bg-secondary" />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <DonutCard
          delay={120}
          icon={<Boxes size={14} />}
          iconClass="bg-secondary/15 text-secondary"
          title={t("product.overview.stockDistribution")}
          segments={[
            { value: in_stock_products, color: COLORS.secondary },
            { value: out_of_stock_products, color: COLORS.error },
          ]}
          center={
            <>
              <AnimatedNumber value={inStockRate} format={fmtPct(0)} />
              <span className="text-[11px] text-on-surface-variant">{t("product.overview.available")}</span>
            </>
          }
          legend={
            <>
              <LegendRow color={COLORS.secondary} label={t("product.overview.inStockProducts")} value={in_stock_products} total={total_products} />
              <LegendRow color={COLORS.error} label={t("product.overview.outOfStockProducts")} value={out_of_stock_products} total={total_products} />
              <LegendRow color={COLORS.warning} label={t("product.overview.lowStockProducts")} value={low_stock_products} total={total_products} />
            </>
          }
        />

        <DonutCard
          delay={180}
          icon={<CheckCircle2 size={14} />}
          iconClass="bg-primary/15 text-primary"
          title={t("product.overview.productActivity")}
          segments={[
            { value: active_products, color: COLORS.primary },
            { value: inactive_products, color: COLORS.outlineVariant },
          ]}
          center={
            <>
              <AnimatedNumber value={activeRate} format={fmtPct(0)} />
              <span className="text-[11px] text-on-surface-variant">{t("product.overview.activeShort")}</span>
            </>
          }
          legend={
            <>
              <LegendRow color={COLORS.primary} label={t("product.overview.activeProducts")} value={active_products} total={total_products} />
              <LegendRow color={COLORS.outlineVariant} label={t("product.overview.inactiveProducts")} value={inactive_products} total={total_products} />
            </>
          }
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-on-surface-variant" />
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">{t("product.overview.valueSection")}</p>
        </div>
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
          <StatTile delay={0} icon={<Wallet size={16} />} iconClass="bg-primary/15 text-primary" label={t("product.overview.inventoryCost")} value={<AnimatedNumber value={Number(inventory_cost) || 0} format={fmtMoney} />} />
          <StatTile delay={60} icon={<TrendingUp size={16} />} iconClass="bg-secondary/15 text-secondary" label={t("product.overview.expectedProfit")} value={<AnimatedNumber value={Number(expected_gross_profit) || 0} format={fmtMoney} />} />
          <StatTile delay={120} icon={<Calculator size={16} />} iconClass="bg-tertiary/15 text-tertiary" label={t("product.overview.avgCost")} value={<AnimatedNumber value={Number(average_product_cost) || 0} format={fmtMoney} />} />
          <StatTile delay={180} icon={<Tags size={16} />} iconClass="bg-primary-fixed-dim/15 text-primary-fixed-dim" label={t("product.overview.avgPrice")} value={<AnimatedNumber value={Number(average_product_price) || 0} format={fmtMoney} />} />
        </div>
      </div>
    </div>
  );
}
