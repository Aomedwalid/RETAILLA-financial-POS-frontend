"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import { usePosProducts, useCart } from "@/features/pos/hooks";
import { posApi } from "@/features/pos/api";
import type { POSProduct, CheckoutResult, POSProductVariant, Customer } from "@/features/pos/types";
import ProductSearch from "@/features/pos/components/ProductSearch";
import ProductGrid from "@/features/pos/components/ProductGrid";
import CartPanel from "@/features/pos/components/CartPanel";
import { DynamicCheckoutDialog, DynamicOrdersTab } from "@/lib/lazy-modals";

type TabId = "sale" | "orders";

function TabButton({ active, icon, label, labelShort, onClick }: { active: boolean; icon: string; label: string; labelShort?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 md:px-5 py-3 text-sm font-bold rounded-t-lg border-b-2 transition-all ${
        active
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{labelShort ?? label}</span>
    </button>
  );
}

export default function POSPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("sale");
  const [cartOpen, setCartOpen] = useState(false);

  const {
    products, loading: productsLoading, page, totalPages, totalItems, keyword, categoryId, categories, size,
    sortBy, sortOrder,
    setPage, setCategoryId, search, handleSortChange,
  } = usePosProducts();
  const {
    cart, items, loading: cartLoading, scBalance, refresh: refreshCart,
    addItem, removeItem, updateQuantity, applyPromo, removePromo, clearCart, fetchScBalance,
  } = useCart();

  const [variantModal, setVariantModal] = useState<{ product: POSProduct; variant: POSProductVariant | null; qty: number } | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [addError, setAddError] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const itemTotal = useMemo(() => {
    if (!cart?.pricing) return 0;
    return parseFloat(cart.pricing.grand_total);
  }, [cart]);

  function variantLabel(v: POSProductVariant): string {
    return Object.entries(v.attributes)
      .filter(([, val]) => val)
      .map(([k, val]) => `${k}: ${String(val)}`)
      .join(", ") || "Default";
  }

  const handleProductSelect = useCallback((product: POSProduct) => {
    setAddError("");
    const variants = product.variants ?? [];
    if (variants.length === 0) {
      setAddError(t("product.noVariants"));
      return;
    }
    if (variants.length === 1) {
      addToCart(variants[0].id, 1);
      return;
    }
    setVariantModal({ product, variant: variants[0], qty: 1 });
  }, []);

  async function addToCart(variantId: string, qty: number) {
    try {
      await addItem(variantId, qty);
      setVariantModal(null);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : t("common.failedToLoad"));
    }
  }

  const handleCustomerChange = useCallback((c: Customer | null) => {
    setCustomer(c);
    if (c) {
      fetchScBalance(c.id);
    }
  }, [fetchScBalance]);

  async function handleCheckout(data: { cash_amount: string; store_credit_amount: string; customer_id?: string; manual_discount_type?: "PERCENTAGE" | "FIXED" | null; manual_discount_value?: number | null; manual_discount_reason?: string | null }) {
    if (!cart) return;
    const result = await posApi.checkout({
      cart_id: cart.id,
      cash_amount: data.cash_amount,
      store_credit_amount: data.store_credit_amount,
      customer_id: data.customer_id,
      manual_discount_type: data.manual_discount_type,
      manual_discount_value: data.manual_discount_value,
      manual_discount_reason: data.manual_discount_reason,
    });
    setCheckoutResult(result);
    setCartOpen(false);
    refreshCart();
  }

  const handleNewSale = useCallback(() => {
    setCheckoutResult(null);
    setCustomer(null);
    refreshCart();
  }, [refreshCart]);

  const handleClearCart = useCallback(async () => {
    await clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 md:px-4 pt-2 pb-0 bg-surface border-b border-outline-variant shrink-0 overflow-x-auto">
        <TabButton
          active={activeTab === "sale"}
          icon="point_of_sale"
          label={t("sale.new")}
          labelShort={t("sale")}
          onClick={() => setActiveTab("sale")}
        />
        <TabButton
          active={activeTab === "orders"}
          icon="receipt_long"
          label={t("salesAndRefunds")}
          onClick={() => setActiveTab("orders")}
        />
      </div>

      {activeTab === "sale" ? (
        <div className="relative flex flex-1 min-h-0">
          {/* Left — Product Browsing */}
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <div className="p-3 md:p-container-margin flex-1 flex flex-col overflow-hidden">
              <ProductSearch
                keyword={keyword}
                onSearch={search}
                categories={categories}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
              />
              <div className="flex items-center justify-end gap-2 mt-2 mb-2">
                <span className="material-symbols-outlined text-outline text-[18px]">sort</span>
                <select
                  value={`${sortBy}|${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 text-body-md text-on-surface-variant outline-none focus:ring-1 focus:ring-primary text-xs"
                >
                  <option value="created_at|desc">{t("pos.sortNewest")}</option>
                  <option value="created_at|asc">{t("pos.sortOldest")}</option>
                  <option value="price|asc">{t("pos.sortPriceLow")}</option>
                  <option value="price|desc">{t("pos.sortPriceHigh")}</option>
                  <option value="name|asc">{t("pos.sortNameAZ")}</option>
                  <option value="name|desc">{t("pos.sortNameZA")}</option>
                </select>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ProductGrid
                  products={products}
                  loading={productsLoading}
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  size={size}
                  onPageChange={setPage}
                  onSelect={handleProductSelect}
                />
                {addError && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{addError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop — Cart Panel (always visible) */}
          <aside className="hidden lg:flex w-[380px] shrink-0 border-r border-outline-variant bg-surface flex-col overflow-hidden">
            <CartPanel
              cart={cart}
              items={items}
              loading={cartLoading}
              customer={customer}
              scBalance={scBalance}
              onCustomerChange={handleCustomerChange}
              onUpdateItem={updateQuantity}
              onRemoveItem={removeItem}
              onApplyPromo={applyPromo}
              onRemovePromo={removePromo}
              onCheckout={handleCheckout}
              onClearCart={handleClearCart}
            />
          </aside>

          {/* Mobile — Cart Drawer (overlay) */}
          <div className={`lg:hidden fixed inset-0 z-50 ${cartOpen ? "" : "pointer-events-none"}`}>
            {cartOpen && (
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setCartOpen(false)}
              />
            )}
            <aside
              className={`absolute top-0 left-0 h-full w-[90vw] max-w-[400px] bg-surface flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                cartOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* Close button */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("cart")}</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
                  aria-label={t("cart.close")}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CartPanel
                  cart={cart}
                  items={items}
                  loading={cartLoading}
                  customer={customer}
                  scBalance={scBalance}
                  onCustomerChange={handleCustomerChange}
                  onUpdateItem={updateQuantity}
                  onRemoveItem={removeItem}
                  onApplyPromo={applyPromo}
                  onRemovePromo={removePromo}
                  onCheckout={handleCheckout}
                  onClearCart={handleClearCart}
                />
              </div>
            </aside>
          </div>

          {/* Mobile — Floating Cart Button */}
          {itemCount > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="lg:hidden fixed bottom-4 left-4 z-30 flex items-center gap-3 bg-primary text-on-primary rounded-full py-3 pr-4 pl-5 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="relative">
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-error text-[10px] font-bold flex items-center justify-center text-on-error">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              </span>
              <span className="font-data-table text-sm font-bold">{formatCurrency(itemTotal)}</span>
            </button>
          )}

          {/* Variant Selection Modal */}
          {variantModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-4 animate-fade-in" onClick={() => setVariantModal(null)}>
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <div className="relative w-[95vw] md:w-full max-w-md bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 md:p-6 border-b border-outline-variant bg-surface-container-highest flex justify-between items-center shrink-0">
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{variantModal.product.name}</h3>
                    <p className="text-[11px] text-outline font-data-table mt-0.5">{t("pos.selectVariant")}</p>
                  </div>
                  <button onClick={() => setVariantModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant shrink-0 mr-2">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  <div className="space-y-2">
                    {variantModal.product.variants?.map((v) => {
                      const selected = variantModal.variant?.id === v.id;
                      const attrEntries = Object.entries(v.attributes).filter(([, val]) => val);
                      return (
                        <button
                          key={v.id}
                          onClick={() => setVariantModal((prev) => prev ? { ...prev, variant: v } : null)}
                          className={`w-full text-left bg-surface-container-low rounded-xl border p-4 transition-all ${
                            selected ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex flex-wrap gap-1.5 min-w-0">
                              {attrEntries.map(([k, val]) => (
                                <span key={k} className="bg-surface-variant/30 text-on-surface-variant px-2 py-0.5 rounded-full text-[11px]">{String(val)}</span>
                              ))}
                            </div>
                            <span className="font-data-table text-sm shrink-0">
                                  {Number(variantModal.product.actual_price) < Number(variantModal.product.price) ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="line-through text-outline">{formatCurrency(variantModal.product.price)}</span>
                                  <span className="text-primary">{formatCurrency(variantModal.product.actual_price)}</span>
                                </span>
                              ) : (
                                <span className="text-primary">{formatCurrency(variantModal.product.price)}</span>
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant font-data-table">{t("pos.stock")}: {v.stock_quantity}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-outline mb-1 block">{t("pos.quantity")}</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setVariantModal((prev) => prev ? { ...prev, qty: Math.max(1, prev.qty - 1) } : null)}
                        disabled={variantModal.qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface disabled:opacity-30 hover:bg-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="w-12 text-center font-headline-sm text-headline-sm text-on-surface">{variantModal.qty}</span>
                      <button
                        onClick={() => setVariantModal((prev) => prev ? { ...prev, qty: Math.min(prev.qty + 1, prev.variant?.stock_quantity ?? 99) } : null)}
                        disabled={variantModal.qty >= (variantModal.variant?.stock_quantity ?? 99)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface disabled:opacity-30 hover:bg-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-container-high/80 backdrop-blur-md shrink-0">
                  <button
                    onClick={() => {
                      const v = variantModal.variant;
                      if (!v) return;
                      addToCart(v.id, variantModal.qty);
                    }}
                    disabled={!variantModal.variant}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {t("pos.addToCart")} — {formatCurrency(variantModal.qty * Number(variantModal.product.actual_price))}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Success Dialog */}
          {checkoutResult && (
            <DynamicCheckoutDialog
              result={checkoutResult}
              onNewSale={handleNewSale}
              onClose={() => setCheckoutResult(null)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <DynamicOrdersTab />
        </div>
      )}
    </div>
  );
}
