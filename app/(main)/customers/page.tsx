"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCustomers } from "@/features/customers/hooks";
import type { CustomerListItem } from "@/features/customers/types";
import CustomerStatsCards from "@/features/customers/components/CustomerStatsCards";
import CustomerToolbar from "@/features/customers/components/CustomerToolbar";
import CustomersTable from "@/features/customers/components/CustomersTable";
import dynamic from "next/dynamic";
import { DynamicCustomerDetailsModal, DynamicCustomerForm } from "@/lib/lazy-modals";
import DeleteCustomerDialog from "@/features/customers/components/DeleteCustomerDialog";

const DynamicDebtDialog = dynamic(() => import("@/features/customers/components/DebtDialog"), { ssr: false });
const DynamicRedeemPointsDialog = dynamic(() => import("@/features/customers/components/RedeemPointsDialog"), { ssr: false });

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "details"; customerId: string }
  | { type: "edit"; customer: CustomerListItem }
  | { type: "debt"; customer: CustomerListItem }
  | { type: "redeem"; customer: CustomerListItem }
  | { type: "delete"; customer: CustomerListItem };

export default function CustomersPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchLocal, setSearchLocal] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const keyword = searchParams.get("keyword") ?? "";
  const active = searchParams.get("active") ?? "";
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortOrder = searchParams.get("sort_order") ?? "desc";

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const size = 10;

  const customersQ = useCustomers({ page, keyword, active, sortBy, sortOrder });
  const data = customersQ.data;
  const loading = customersQ.isLoading;

  function updateURL(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleSearch(val: string) {
    setSearchLocal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateURL("keyword", val), 300);
  }

  function handleActiveFilter(val: string) {
    updateURL("active", val);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleSaved() {
    setModal({ type: "none" });
  }

  const customers = data?.items ?? [];

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t("nav.customers")}</h2>
          <p className="text-on-surface-variant mt-1 text-sm">{t("customer.details")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <CustomerStatsCards customers={customers} loading={loading} />

      {/* Toolbar */}
      <CustomerToolbar
        searchValue={searchLocal}
        onSearchChange={handleSearch}
        activeFilter={active}
        onActiveFilterChange={handleActiveFilter}
        onRefresh={() => customersQ.refetch()}
        onAdd={() => setModal({ type: "create" })}
      />

      {/* Sort Controls */}
      <div className="flex items-center justify-end gap-2 mb-gutter flex-wrap">
        <span className="material-symbols-outlined text-outline text-[18px]">sort</span>
        <select
          value={`${sortBy}|${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("|");
            const params = new URLSearchParams(searchParams.toString());
            params.set("sort_by", field);
            params.set("sort_order", order);
            params.delete("page");
            router.push(`?${params.toString()}`, { scroll: false });
          }}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-body-md text-on-surface-variant outline-none focus:ring-1 focus:ring-primary text-xs"
        >
          <option value="created_at|desc">{t("pos.sortNewest")}</option>
          <option value="created_at|asc">{t("pos.sortOldest")}</option>
          <option value="name|asc">{t("pos.sortNameAZ")}</option>
          <option value="name|desc">{t("pos.sortNameZA")}</option>
          <option value="total_spent|desc">{t("customer.totalSpent")}: {t("pos.sortPriceHigh")}</option>
          <option value="total_spent|asc">{t("customer.totalSpent")}: {t("pos.sortPriceLow")}</option>
          <option value="loyalty_points|desc">{t("customer.loyaltyPoints")}: {t("pos.sortPriceHigh")}</option>
          <option value="loyalty_points|asc">{t("customer.loyaltyPoints")}: {t("pos.sortPriceLow")}</option>
        </select>
      </div>

      {/* Customers Table */}
      <CustomersTable
        customers={customers}
        loading={loading}
        page={page}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        size={size}
        onPageChange={handlePageChange}
        onView={(id) => setModal({ type: "details", customerId: id })}
        onEdit={(customer) => setModal({ type: "edit", customer })}
        onDelete={(customer) => setModal({ type: "delete", customer })}
      />

      {/* Modals */}
      {modal.type === "create" && (
        <DynamicCustomerForm onClose={() => setModal({ type: "none" })} onSaved={handleSaved} />
      )}

      {modal.type === "edit" && (
        <DynamicCustomerForm customer={modal.customer} onClose={() => setModal({ type: "none" })} onSaved={handleSaved} />
      )}

      {modal.type === "details" && (
        <DynamicCustomerDetailsModal
          customerId={modal.customerId}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => {
            const c = customers.find((c) => c.id === modal.customerId);
            if (c) setModal({ type: "edit", customer: c });
          }}
          onDebt={() => {
            const c = customers.find((c) => c.id === modal.customerId);
            if (c) setModal({ type: "debt", customer: c });
          }}
          onRedeem={() => {
            const c = customers.find((c) => c.id === modal.customerId);
            if (c) setModal({ type: "redeem", customer: c });
          }}
          onDelete={() => {
            const c = customers.find((c) => c.id === modal.customerId);
            if (c) setModal({ type: "delete", customer: c });
          }}
        />
      )}

      {modal.type === "debt" && (
        <DynamicDebtDialog customer={modal.customer} onClose={() => setModal({ type: "none" })} onAdjusted={handleSaved} />
      )}

      {modal.type === "redeem" && (
        <DynamicRedeemPointsDialog customer={modal.customer} onClose={() => setModal({ type: "none" })} onRedeemed={handleSaved} />
      )}

      {modal.type === "delete" && (
        <DeleteCustomerDialog customer={modal.customer} onClose={() => setModal({ type: "none" })} onDeleted={handleSaved} />
      )}
    </div>
  );
}
