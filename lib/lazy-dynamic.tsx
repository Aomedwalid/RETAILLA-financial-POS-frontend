import dynamic from "next/dynamic";

export const DynamicStoreOverviewCards = dynamic(
  () => import("@/components/dashboard/StoreOverviewCards"),
  {
    loading: () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-gutter">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 border-s-4 border-surface-container-highest animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-surface-container-highest/60" />
            <div className="h-6 w-20 rounded bg-surface-container-highest/60 mt-4" />
            <div className="h-3 w-16 rounded bg-surface-container-highest/60 mt-2" />
          </div>
        ))}
      </div>
    ),
  }
);

export const DynamicCashPositionCard = dynamic(
  () => import("@/components/dashboard/CashPositionCard"),
  { loading: () => <DashboardCardSkeleton /> }
);

export const DynamicNetPositionCard = dynamic(
  () => import("@/components/dashboard/NetPositionCard"),
  { loading: () => <DashboardCardSkeleton /> }
);

export const DynamicWorkingCapitalGauge = dynamic(
  () => import("@/components/dashboard/WorkingCapitalGauge"),
  { loading: () => <DashboardCardSkeleton /> }
);

export const DynamicCashRunwayCard = dynamic(
  () => import("@/components/dashboard/CashRunwayCard"),
  { loading: () => <DashboardCardSkeleton /> }
);

export const DynamicDailySummaryChart = dynamic(
  () => import("@/components/dashboard/DailySummaryChart"),
  { loading: () => <DashboardCardSkeleton className="min-h-[200px]" /> }
);

export const DynamicPaymentDistributionDonut = dynamic(
  () => import("@/components/dashboard/PaymentDistributionDonut"),
  { loading: () => <DashboardCardSkeleton className="min-h-[200px]" /> }
);

export const DynamicBreakEvenCard = dynamic(
  () => import("@/components/dashboard/BreakEvenCard"),
  { loading: () => <DashboardCardSkeleton /> }
);

export const DynamicProfitabilityTable = dynamic(
  () => import("@/components/dashboard/ProfitabilityTable"),
  { loading: () => <DashboardCardSkeleton className="min-h-[200px]" /> }
);

export const DynamicLocationPerformanceTable = dynamic(
  () => import("@/components/dashboard/LocationPerformanceTable"),
  { loading: () => <DashboardCardSkeleton className="min-h-[200px]" /> }
);

export const DynamicAnomaliesFeed = dynamic(
  () => import("@/components/dashboard/AnomaliesFeed"),
  { loading: () => <DashboardCardSkeleton className="min-h-[200px]" /> }
);

function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse ${className ?? ""}`}>
      <div className="h-3 w-24 rounded bg-surface-container-highest/60 mb-4" />
      <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
    </div>
  );
}
