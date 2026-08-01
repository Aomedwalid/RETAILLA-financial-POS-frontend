"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts, useProductCategories, useCategories, useToggleCategory } from "@/features/products/hooks";
import { productsApi, categoriesApi } from "@/features/products/api";
import type { PaginatedResponse, ProductResponse, Category } from "@/features/products/types";
import ExportButton, { type ExcelColumn } from "@/components/export/ExportButton";
import { DynamicProductDetailsModal, DynamicProductForm } from "@/lib/lazy-modals";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthContext";
import InventoryOverviewTab from "@/features/products/components/InventoryOverviewTab";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "details"; productId: string }
  | { type: "edit"; product: ProductResponse }
  | { type: "stock"; product: ProductResponse }
  | { type: "delete"; product: ProductResponse };

type CategoryModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; category: Category }
  | { type: "delete"; category: Category };

export default function ProductsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "TENANT_ADMIN" || user?.role === "ADMIN";
  const [searchLocal, setSearchLocal] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [activeTab, setActiveTab] = useState<"products" | "overview" | "categories">("products");
  const [catPage, setCatPage] = useState(1);
  const [catModal, setCatModal] = useState<CategoryModalState>({ type: "none" });

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const lowStock = searchParams.get("low_stock") ?? "";
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortOrder = searchParams.get("sort_order") ?? "desc";

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriesQ = useProductCategories();
  const categories = categoriesQ.data ?? [];

  const productsQ = useProducts({ page, keyword, categoryId, lowStock, sortBy, sortOrder });
  const data = productsQ.data;
  const loading = productsQ.isLoading;

  const catQ = useCategories({ page: catPage }, { enabled: activeTab === "categories" });
  const catData = catQ.data;
  const catLoading = catQ.isLoading;

  const toggleCategoryMutation = useToggleCategory();

  const size = 10;

  const exportColumns = useMemo<ExcelColumn<ProductResponse>[]>(
    () => [
      { header: t("product.name"), value: (p) => p.name },
      { header: t("product.category"), value: (p) => p.category_name ?? "" },
      { header: t("product.price"), type: "currency", value: (p) => p.price },
      { header: t("product.stock"), type: "number", value: (p) => p.stock_quantity },
      { header: t("product.priceActual"), type: "currency", value: (p) => p.actual_price },
      { header: t("product.sku"), value: (p) => p.sku },
      { header: t("product.cost"), type: "currency", value: (p) => p.cost },
      { header: t("common.date"), type: "date", value: (p) => p.created_at },
    ],
    [t]
  );

  const exportFetch = useCallback(
    async (page: number, size: number) => {
      const sortParams = { sort_by: sortBy, sort_order: sortOrder };
      if (keyword) {
        return productsApi.search({ keyword, page, size, ...sortParams });
      }
      const params: Record<string, string | number | boolean> = { page, size, ...sortParams };
      if (categoryId) params.category_id = categoryId;
      if (lowStock === "true") params.low_stock = true;
      return productsApi.list(params);
    },
    [keyword, categoryId, lowStock, sortBy, sortOrder]
  );

  function updateURL(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleSearch(val: string) {
    setSearchLocal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateURL("keyword", val), 300);
  }

  function handleSaved() {
    setModal({ type: "none" });
  }

  function handleCatSaved() {
    setCatModal({ type: "none" });
    setCatPage(1);
  }

  function handleViewLowStock() {
    setActiveTab("products");
    router.push("/products?low_stock=true", { scroll: false });
  }

  const products = data?.items ?? [];
  const catItems = catData?.items ?? [];

  return (
    <div className="p-container-margin flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Page Header */}
      {activeTab === "overview" ? (
        <div className="flex justify-between items-end mb-stack-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t("product.overview.title")}</h2>
            <p className="text-on-surface-variant mt-1 text-sm">{t("product.overview.description")}</p>
          </div>
        </div>
      ) : activeTab === "products" ? (
        <div className="flex justify-between items-end mb-stack-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t("product.title")}</h2>
            <p className="text-on-surface-variant mt-1 text-sm">{t("product.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton columns={exportColumns} fetchPage={exportFetch} fileName="Products" batchSize={100} />
            <Link
              href="/products/new"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              {t("product.newProduct")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-end mb-stack-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t("product.category")}</h2>
            <p className="text-on-surface-variant mt-1 text-sm">{t("product.filter")}</p>
          </div>
          <button
            onClick={() => setCatModal({ type: "create" })}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            {t("product.category")}
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-8 border-b border-outline-variant overflow-x-auto hide-scroll mb-gutter">
        <button
          onClick={() => { setActiveTab("products"); setCatPage(1); }}
          className={`relative pb-4 font-label-caps text-label-caps whitespace-nowrap transition-colors ${
            activeTab === "products"
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("product.title")}
          {activeTab === "products" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("overview")}
            className={`relative pb-4 font-label-caps text-label-caps whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("product.overview.title")}
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab("categories")}
          className={`relative pb-4 font-label-caps text-label-caps whitespace-nowrap transition-colors ${
            activeTab === "categories"
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t("product.category")}
          {activeTab === "categories" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "overview" ? (
        <InventoryOverviewTab onViewLowStock={handleViewLowStock} />
      ) : activeTab === "products" ? (
        <>
          {/* Filter Section */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-wrap items-center gap-4 mb-gutter">
            <div className="flex-1 min-w-[240px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">filter_list</span>
              <input
                type="text"
                value={searchLocal}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("product.search")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-md outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => updateURL("category_id", e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-4 text-body-md text-on-surface-variant outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("product.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="h-8 w-px bg-outline-variant hidden sm:block" />
            <div className="flex gap-2">
              {[
                { label: t("product.active"), value: "", color: "bg-secondary" },
                { label: t("product.lowStock"), value: "true", color: "bg-secondary" },
              ].map((opt) => {
                const active = lowStock === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => updateURL("low_stock", active ? "" : opt.value)}
                    className={`px-4 py-2 rounded-full text-label-caps flex items-center gap-2 transition-colors ${
                      active
                        ? "border border-secondary/50 bg-secondary/10 text-secondary"
                        : "border border-outline-variant hover:bg-surface-variant/10"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="h-8 w-px bg-outline-variant hidden sm:block" />
            <div className="flex items-center gap-2">
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
                <option value="created_at|desc">{t("product.newest")}</option>
                <option value="created_at|asc">{t("product.oldest")}</option>
                <option value="price|asc">{t("product.priceLow")}</option>
                <option value="price|desc">{t("product.priceHigh")}</option>
                <option value="name|asc">{t("product.nameAZ")}</option>
                <option value="name|desc">{t("product.nameZA")}</option>
                <option value="stock_quantity|desc">{t("product.stock")}: {t("pos.sortPriceHigh")}</option>
                <option value="stock_quantity|asc">{t("product.stock")}: {t("pos.sortPriceLow")}</option>
              </select>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                  <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("product.name")}</th>
                  <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-center">{t("product.category")}</th>
                  <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("product.price")}</th>
                  <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-center">{t("product.stock")}</th>

                  <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
{Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-card-padding py-4">
                          <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-card-padding py-16 text-center">
                      <span className="material-symbols-outlined text-[40px] text-outline mb-2">inventory_2</span>
                      <p className="text-on-surface-variant">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = p.is_low_stock ?? (p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);
                    const stockPct = p.low_stock_threshold > 0
                      ? Math.min((p.stock_quantity / (p.low_stock_threshold * 3)) * 100, 100)
                      : Math.min((p.stock_quantity / 100) * 100, 100);
                    const stockColor = p.stock_quantity === 0 ? "bg-error" :
                      isLowStock ? "bg-error" :
                      p.stock_quantity <= p.low_stock_threshold * 2 ? "bg-primary" : "bg-secondary";
                    const stockTextColor = p.stock_quantity === 0 ? "text-error" :
                      isLowStock ? "text-error" :
                      p.stock_quantity <= p.low_stock_threshold * 2 ? "text-primary" : "text-secondary";

                    return (
                      <tr key={p.id} className="hover:bg-surface-variant/10 transition-colors group"
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "inset 4px 0 0 #acc7ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                      >
                        <td className="px-card-padding py-3">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setModal({ type: "details", productId: p.id })}>
                            <div className="w-10 h-10 rounded-lg bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                            </div>
                            <div>
                              <div className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-[11px] text-outline font-data-table">SKU: {p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-card-padding py-3 text-center">
                          <span className="bg-surface-variant/30 px-3 py-1 rounded-full text-[12px] text-on-surface-variant">
                            {p.category_name ?? "\u2014"}
                          </span>
                        </td>
                        <td className="px-card-padding py-3 text-right font-data-table text-sm">
                          {Number(p.actual_price) < Number(p.price) ? (
                            <span className="inline-flex items-center gap-1.5 justify-end">
                              <span className="line-through text-outline">{formatCurrency(p.price)}</span>
                              <span className="text-primary font-bold">{formatCurrency(p.actual_price)}</span>
                              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-secondary/15 text-secondary">{t("product.sale")}</span>
                            </span>
                          ) : (
                            <span className="text-primary">{formatCurrency(p.price)}</span>
                          )}
                        </td>
                        <td className="px-card-padding py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`${stockTextColor} px-2.5 py-0.5 rounded-full text-[11px] font-bold`}>
                              {p.stock_quantity === 0 ? t("product.outOfStock") : `${p.stock_quantity} ${t("product.units")}`}
                            </span>
                            <div className="w-16 h-1 bg-surface-variant rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full ${stockColor}`} style={{ width: `${Math.max(stockPct, p.stock_quantity > 0 ? 8 : 0)}%` }} />
                            </div>
                          </div>
                        </td>

                        <td className="px-card-padding py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setModal({ type: "stock", product: p })}
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-primary/20 text-primary transition-colors"
                              title={t("product.adjust")}
                            >
                              <span className="material-symbols-outlined text-[20px]">inventory</span>
                            </button>
                            <button
                              onClick={() => setModal({ type: "edit", product: p })}
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant transition-colors"
                              title={t("common.edit")}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-card-padding py-4 bg-surface-container-high/30 flex justify-between items-center">
                <p className="text-body-md text-on-surface-variant">
                  {t("common.showing")} <span className="text-on-surface font-semibold">{Math.min((page - 1) * size + 1, data.total)}-{Math.min(page * size, data.total)}</span> {t("common.of")} <span className="text-on-surface font-semibold">{data.total}</span> {t("common.items")}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-body-md text-on-surface-variant">{t("common.page")} {page} {t("common.of")} {data.pages}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(Math.max(1, page - 1)));
                        router.push(`?${params.toString()}`, { scroll: false });
                      }}
                      disabled={page <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => {
                      const start = Math.max(1, page - 2);
                      const p = start + i;
                      if (p > data.pages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("page", String(p));
                            router.push(`?${params.toString()}`, { scroll: false });
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                            p === page
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-surface-variant/20 hover:bg-surface-variant/40"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(Math.min(data.pages, page + 1)));
                        router.push(`?${params.toString()}`, { scroll: false });
                      }}
                      disabled={page >= data.pages}
                      className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Categories Content */
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("product.name")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline">{t("common.description")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-center">{t("product.active")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-center">{t("product.title")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("pos.sortBy")}</th>
                <th className="px-card-padding py-4 font-label-caps text-label-caps text-outline text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {catLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-card-padding py-4">
                        <div className="h-4 w-3/4 rounded bg-surface-container-highest/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : catItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-card-padding py-16 text-center">
                    <span className="material-symbols-outlined text-[40px] text-outline mb-2">category</span>
                    <p className="text-on-surface-variant">{t("product.noCategories")}</p>
                  </td>
                </tr>
              ) : (
                catItems.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-variant/10 transition-colors group">
                    <td className="px-card-padding py-3">
                      <span className="font-semibold text-on-surface text-sm">{c.name}</span>
                    </td>
                    <td className="px-card-padding py-3 text-sm text-on-surface-variant max-w-[200px] truncate">
                      {c.description || "\u2014"}
                    </td>
                    <td className="px-card-padding py-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => toggleCategoryMutation.mutate(c.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                      </label>
                    </td>
                    <td className="px-card-padding py-3 text-center">
                      <span className="bg-surface-variant/30 px-3 py-1 rounded-full text-[12px] text-on-surface-variant">
                        {c.product_count}
                      </span>
                    </td>
                    <td className="px-card-padding py-3 text-right font-data-table text-sm text-on-surface">
                      {c.sort_order}
                    </td>
                    <td className="px-card-padding py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setCatModal({ type: "edit", category: c })}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant text-on-surface-variant transition-colors"
                          title={t("common.edit")}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => setCatModal({ type: "delete", category: c })}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-error/20 text-error transition-colors"
                          title={t("common.delete")}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Categories Pagination */}
          {catData && catData.pages > 1 && (
            <div className="px-card-padding py-4 bg-surface-container-high/30 flex justify-between items-center">
              <p className="text-body-md text-on-surface-variant">
                {t("common.showing")} <span className="text-on-surface font-semibold">{Math.min((catPage - 1) * 10 + 1, catData.total)}-{Math.min(catPage * 10, catData.total)}</span> {t("common.of")} <span className="text-on-surface font-semibold">{catData.total}</span> {t("common.items")}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-body-md text-on-surface-variant">{t("common.page")} {catPage} {t("common.of")} {catData.pages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCatPage(Math.max(1, catPage - 1))}
                    disabled={catPage <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(catData.pages, 5) }, (_, i) => {
                    const start = Math.max(1, catPage - 2);
                    const p = start + i;
                    if (p > catData.pages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setCatPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                          p === catPage
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-variant/20 hover:bg-surface-variant/40"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCatPage(Math.min(catData.pages, catPage + 1))}
                    disabled={catPage >= catData.pages}
                    className="w-8 h-8 flex items-center justify-center rounded bg-surface-variant/20 text-outline disabled:opacity-30 hover:bg-surface-variant/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      {modal.type === "create" && (
        <CreateProductModal onClose={() => setModal({ type: "none" })} onSaved={handleSaved} />
      )}

      {modal.type === "edit" && (
        <DynamicProductForm product={modal.product} onClose={() => setModal({ type: "none" })} onSaved={handleSaved} />
      )}

      {modal.type === "details" && (
        <DynamicProductDetailsModal productId={modal.productId} onClose={() => setModal({ type: "none" })} />
      )}

      {/* Stock Adjustment Modal */}
      {modal.type === "stock" && (
        <StockModal product={modal.product} onClose={() => setModal({ type: "none" })} onAdjusted={handleSaved} />
      )}

      {/* Category Modals */}
      {catModal.type === "create" && (
        <CategoryFormModal onClose={() => setCatModal({ type: "none" })} onSaved={handleCatSaved} />
      )}
      {catModal.type === "edit" && (
        <CategoryFormModal category={catModal.category} onClose={() => setCatModal({ type: "none" })} onSaved={handleCatSaved} />
      )}
      {catModal.type === "delete" && (
        <DeleteCategoryDialog category={catModal.category} onClose={() => setCatModal({ type: "none" })} onDeleted={handleCatSaved} />
      )}
    </div>
  );
}

// ─── Create Product Modal ───

function CreateProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [lowThreshold, setLowThreshold] = useState("10");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { productsApi.getCategories().then(setCategories).catch(() => {}); }, []);

  async function handleSubmit() {
    if (!name.trim()) { setError(t("product.nameRequired")); return; }
    if (!price || parseFloat(price) <= 0) { setError(t("product.priceRequired")); return; }
    setError(""); setSubmitting(true);
    try {
      await productsApi.create({
        name, price: parseFloat(price), cost: parseFloat(cost || "0"),
        low_stock_threshold: parseInt(lowThreshold, 10) || 10,
        category_id: categoryId || undefined, variants_enabled: false,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-2xl bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("product.newProduct")}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8" style={{ scrollbarWidth: "none" }}>
          <section>
            <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("product.basics")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.name")}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md" placeholder={t("product.namePlaceholder")} />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.category")}</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md">
                  <option value="">{t("product.selectCategory")}</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
            </div>
          </section>
          <section>
            <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("product.inventory")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.initialStock")}</label>
                <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md" />
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.lowStockThreshold")}</label>
                <input type="number" value={lowThreshold} onChange={(e) => setLowThreshold(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md" />
              </div>
            </div>
          </section>
          <section>
            <h4 className="text-label-caps font-label-caps text-primary mb-4">{t("product.pricing")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.price")}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-md">{t("common.currencySymbol")}</span>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-7 pr-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.cost")}</label>
                <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md font-data-table" placeholder="0.00" />
              </div>
            </div>
          </section>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">{t("common.cancel")}</button>
          <button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("product.newProduct")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Adjustment Modal ───

function StockModal({ product, onClose, onAdjusted }: { product: ProductResponse; onClose: () => void; onAdjusted: () => void }) {
  const { t } = useTranslation();
  const [type, setType] = useState<"ADD" | "SUBTRACT">("ADD");
  const [quantity, setQuantity] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const variants = product.variants ?? [];
  const showVariantPicker = variants.length > 1;

  async function handleSubmit() {
    if (!quantity || parseInt(quantity, 10) <= 0) { setError(t("product.quantityRequired")); return; }
    setError(""); setSubmitting(true);
    try {
      const qty = parseInt(quantity, 10);
      const variantId = selectedIdx >= 0 ? variants[selectedIdx].id : variants[0]?.id;
      await productsApi.adjustStock(product.id, {
        operation: type,
        quantity: qty,
        ...(variantId ? { variant_id: variantId } : {}),
      });
      onAdjusted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 md:p-6 border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("product.adjust")}</h3>
          <p className="text-[12px] text-outline mt-1">{t("product.name")}: {product.name}</p>
        </div>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant">
            <span className="text-on-surface-variant">{t("product.currentStock")}</span>
            <span className="font-data-table text-headline-sm text-secondary">{product.stock_quantity}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType("ADD")}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                type === "ADD" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant hover:border-primary hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined">add</span>
              <span className="text-[10px] font-bold">{t("common.add")}</span>
            </button>
            <button
              onClick={() => setType("SUBTRACT")}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                type === "SUBTRACT" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant hover:border-primary hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined">remove</span>
              <span className="text-[10px] font-bold">{t("common.remove")}</span>
            </button>
          </div>
          <div className="space-y-4">
            {showVariantPicker && (
              <div>
                <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.variant")}</label>
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(parseInt(e.target.value, 10))}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 outline-none focus:ring-1 focus:ring-primary text-body-md"
                >
                  {variants.map((v, idx) => (
                    <option key={v.id} value={idx}>
                      {Object.entries(v.attributes).map(([k, val]) => `${k}: ${String(val)}`).join(", ") || "Default"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="font-label-caps text-[10px] text-outline mb-1 block">
                {type === "ADD" ? t("product.quantityAdd") : t("product.quantityRemove")}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 outline-none focus:ring-1 focus:ring-primary text-headline-sm font-data-table text-center"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 bg-surface-container-high/80 border-t border-outline-variant flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">{t("common.cancel")}</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Form Modal (Create / Edit) ───

function CategoryFormModal({ category, onClose, onSaved }: { category?: Category; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) { setError(t("product.categoryNameRequired")); return; }
    setError(""); setSubmitting(true);
    try {
      if (isEdit) {
        await categoriesApi.update(category!.id, { name, description: description || undefined });
      } else {
        await categoriesApi.create({ name, description: description || undefined });
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-lg bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-highest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {isEdit ? t("common.edit") : t("product.newProduct")}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4 md:p-6 space-y-6">
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("product.name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md"
              placeholder={t("product.namePlaceholder")}
            />
          </div>
          <div>
            <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("common.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary text-body-md resize-none"
              placeholder={t("common.optional")}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : isEdit ? t("common.save") : t("product.newProduct")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Category Dialog ───

function DeleteCategoryDialog({ category, onClose, onDeleted }: { category: Category; onClose: () => void; onDeleted: () => void }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError(""); setSubmitting(true);
    try {
      await categoriesApi.delete(category.id);
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 md:p-6 border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("common.delete")}</h3>
        </div>
        <div className="p-4 md:p-6">
          <p className="text-on-surface-variant">
            {t("common.confirmDelete")} <span className="font-semibold text-on-surface">{category.name}</span>? {t("common.cannotUndo")}
          </p>
          {category.product_count > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{t("common.cannotUndo")}</span>
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant/20 transition-colors">
            {t("common.cancel")}
          </button>
          <button onClick={handleDelete} disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-error text-on-error font-bold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {submitting ? t("common.saving") : t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}