"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import DiscountsTab from "@/features/discounts/components/DiscountsTab";
import PromoCodesTab from "@/features/discounts/components/PromoCodesTab";
import DiscountAnalyticsCards from "@/features/discounts/components/DiscountAnalyticsCards";
import DateRangePopover from "@/components/layout/DateRangePopover";

type Tab = "overview" | "discounts" | "promo-codes";

export default function DiscountsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="p-4 md:p-container-margin flex-1 overflow-y-auto space-y-4 md:space-y-stack-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter border-b border-outline-variant">
        <div className="space-y-1 pb-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {t("discount.title")}
          </h2>
          <p className="text-on-surface-variant text-sm">
            {t("discount.overview")}
          </p>
        </div>
        <div className="pb-4">
          <DateRangePopover />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-outline-variant overflow-x-auto hide-scroll">
        <button
          onClick={() => setActiveTab("overview")}
          className={`relative pb-4 font-label-caps text-label-caps transition-colors ${
            activeTab === "overview"
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("discount.overviewTab")}
          {activeTab === "overview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`relative pb-4 font-label-caps text-label-caps transition-colors ${
            activeTab === "discounts"
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("discount.discountsTab")}
          {activeTab === "discounts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("promo-codes")}
          className={`relative pb-4 font-label-caps text-label-caps transition-colors ${
            activeTab === "promo-codes"
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("discount.promosTab")}
          {activeTab === "promo-codes" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? <DiscountAnalyticsCards /> : activeTab === "discounts" ? <DiscountsTab /> : <PromoCodesTab />}
    </div>
  );
}
