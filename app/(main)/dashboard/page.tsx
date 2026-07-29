"use client";

import { Suspense } from "react";
import DateRangePopover from "@/components/layout/DateRangePopover";
import { useTranslation } from "react-i18next";
import {
  DynamicStoreOverviewCards,
  DynamicCashPositionCard,
  DynamicNetPositionCard,
  DynamicWorkingCapitalGauge,
  DynamicCashRunwayCard,
  DynamicDailySummaryChart,
  DynamicPaymentDistributionDonut,
  DynamicBreakEvenCard,
  DynamicProfitabilityTable,
  DynamicLocationPerformanceTable,
  DynamicAnomaliesFeed,
} from "@/lib/lazy-dynamic";

function DashboardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-container-highest/60 mb-4" />
      <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="p-container-margin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-headline-md font-bold text-on-surface">{t("dashboard.title")}</h1>
        <DateRangePopover />
      </div>

      <div className="mb-6">
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-gutter">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 border-s-4 border-surface-container-highest animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-surface-container-highest/60" />
                <div className="h-6 w-20 rounded bg-surface-container-highest/60 mt-4" />
                <div className="h-3 w-16 rounded bg-surface-container-highest/60 mt-2" />
              </div>
            ))}
          </div>
        }>
          <DynamicStoreOverviewCards />
        </Suspense>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 md:col-span-8 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicCashPositionCard /></Suspense>
        </div>
        <div className="col-span-12 md:col-span-4 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicNetPositionCard /></Suspense>
        </div>

        <div className="col-span-12 lg:col-span-4 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicWorkingCapitalGauge /></Suspense>
        </div>
        <div className="col-span-12 lg:col-span-8 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicCashRunwayCard /></Suspense>
        </div>

        <div className="col-span-12 lg:col-span-7 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicDailySummaryChart /></Suspense>
        </div>
        <div className="col-span-12 lg:col-span-5 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicPaymentDistributionDonut /></Suspense>
        </div>

        <div className="col-span-12 lg:col-span-4 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicBreakEvenCard /></Suspense>
        </div>
        <div className="col-span-12 lg:col-span-8 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicProfitabilityTable /></Suspense>
        </div>

        <div className="col-span-12 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicAnomaliesFeed /></Suspense>
        </div>

        <div className="col-span-12 grid">
          <Suspense fallback={<DashboardSkeleton />}><DynamicLocationPerformanceTable /></Suspense>
        </div>
      </div>
    </div>
  );
}
