"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";
import type { Cart, CartItem, Customer } from "../types";
import CartItemRow from "./CartItem";
import PricingSummary from "./PricingSummary";
import PromoCodeInput from "./PromoCodeInput";
import CustomerSelector from "./CustomerSelector";

interface CartPanelProps {
  cart: Cart | null;
  items: CartItem[];
  loading: boolean;
  customer: Customer | null;
  scBalance: number;
  onCustomerChange: (c: Customer | null) => void;
  onUpdateItem: (variantId: string, quantity: number) => Promise<unknown>;
  onRemoveItem: (variantId: string) => Promise<unknown>;
  onApplyPromo: (code: string) => Promise<unknown>;
  onRemovePromo: () => Promise<unknown>;
  onCheckout: (data: { cash_amount: string; store_credit_amount: string; customer_id?: string; manual_discount_type?: "PERCENTAGE" | "FIXED" | null; manual_discount_value?: number | null; manual_discount_reason?: string | null }) => Promise<void>;
  onClearCart: () => Promise<void>;
}

const DEFAULT_MAX_DISCOUNT_PCT = 25;
const DEFAULT_MAX_DISCOUNT_AMOUNT = 500;

export default function CartPanel({ cart, items, loading, customer, scBalance, onCustomerChange, onUpdateItem, onRemoveItem, onApplyPromo, onRemovePromo, onCheckout, onClearCart }: CartPanelProps) {
  const { t } = useTranslation();
  const [cashAmount, setCashAmount] = useState(0);
  const [storeCreditAmount, setStoreCreditAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Discount state
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalDue = cart?.pricing ? parseFloat(cart.pricing.grand_total) : 0;

  const computedDiscountAmount = useMemo(() => {
    if (!discountEnabled || discountValue <= 0) return 0;
    if (discountType === "PERCENTAGE") {
      return Math.min(totalDue * (discountValue / 100), DEFAULT_MAX_DISCOUNT_AMOUNT);
    }
    return Math.min(discountValue, DEFAULT_MAX_DISCOUNT_AMOUNT, totalDue);
  }, [discountEnabled, discountType, discountValue, totalDue]);

  const effectiveTotal = Math.max(0, totalDue - computedDiscountAmount);

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (totalDue <= 0) errs.push(t("cart.empty"));
    if (discountEnabled) {
      if (discountValue <= 0) errs.push(t("pos.manualDiscount") + " " + t("validation.required"));
      if (discountType === "PERCENTAGE" && discountValue > DEFAULT_MAX_DISCOUNT_PCT) errs.push(t("pos.maxDiscountPercent") + ` ${DEFAULT_MAX_DISCOUNT_PCT}%`);
      if (discountType === "FIXED" && discountValue > DEFAULT_MAX_DISCOUNT_AMOUNT) errs.push(t("pos.maxDiscountAmount") + ` ${formatCurrency(DEFAULT_MAX_DISCOUNT_AMOUNT)}`);
      if (discountType === "FIXED" && discountValue > totalDue) errs.push(t("pos.discountCannotExceed"));
    }
    if (cashAmount < 0 || storeCreditAmount < 0) errs.push(t("pos.amountsCannotBeNegative"));
    if (cashAmount <= 0 && storeCreditAmount <= 0) errs.push(t("pos.enterCashOrCredit"));
    if (storeCreditAmount > 0 && !customer) errs.push(t("pos.customerRequired"));
    if (storeCreditAmount > scBalance) errs.push(t("pos.insufficientCredit"));
    return errs;
  }, [totalDue, discountEnabled, discountType, discountValue, cashAmount, storeCreditAmount, customer, scBalance]);

  const canCheckout = totalDue > 0 && (cashAmount > 0 || storeCreditAmount > 0) && !submitting && validationErrors.length === 0;
  const displayError = error || (validationErrors.length > 0 ? validationErrors[0] : "");

  async function handleCheckout() {
    if (!cart || validationErrors.length > 0) return;
    setError("");
    setSubmitting(true);
    try {
      await onCheckout({
        cash_amount: cashAmount.toFixed(2),
        store_credit_amount: storeCreditAmount.toFixed(2),
        customer_id: customer?.id ?? undefined,
        ...(discountEnabled && discountReason.trim()
          ? { manual_discount_type: discountType, manual_discount_value: discountValue, manual_discount_reason: discountReason.trim() }
          : {}),
      });
    } catch (err: unknown) {
      console.error("CHECKOUT ERROR", err);
      const msg = err instanceof Error ? err.message : t("pos.checkoutError");
      const detail = (err as { details?: unknown }).details;
      setError(detail ? `${msg}: ${JSON.stringify(detail)}` : msg);
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="h-full bg-surface flex flex-col">
        <div className="p-container-margin border-b border-outline-variant animate-pulse space-y-4">
          <div className="h-5 w-24 rounded bg-surface-container-highest/60" />
          <div className="h-8 rounded-lg bg-surface-container-highest/60" />
        </div>
        <div className="flex-1 p-container-margin space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-surface-container-highest/60" />
                <div className="h-3 w-1/2 rounded bg-surface-container-highest/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full bg-surface flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-container-margin border-b border-outline-variant space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm">{t("sale.new")}</h2>
            {items.length > 0 && (
              <button onClick={onClearCart} className="text-xs font-semibold text-error hover:underline transition-all">{t("cart.clear")}</button>
            )}
          </div>
          <div className="relative">
            {customer ? (
              <div className="flex items-center justify-between bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface truncate">{customer.name || customer.email}</p>
                  <p className="text-[10px] text-outline truncate">
                    {customer.name && <>{customer.email} &middot; </>}
                    {t("storeCredit.balance")}: {formatCurrency(scBalance)}
                  </p>
                </div>
                <button onClick={() => onCustomerChange(null)} className="text-[11px] text-error hover:underline shrink-0 mr-2">{t("cart.clear")}</button>
              </div>
            ) : (
              <button onClick={() => setShowCustomerModal(true)} className="w-full flex items-center gap-2 bg-surface-container-high border border-dashed border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all">
                <span className="material-symbols-outlined text-sm">person_add</span>
                {t("customer.select")}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable middle: cart items + discount + payments */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Cart Items */}
          <div className="p-container-margin space-y-4 border-b border-outline-variant">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 border border-outline-variant border-dashed">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">shopping_cart</span>
                </div>
                <p className="text-xs text-on-surface-variant">{t("cart.empty")}</p>
              </div>
            ) : (
              items.map((item) => (
                <CartItemRow key={item.variant_id} item={item} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
              ))
            )}
          </div>

          {/* Promo + Summary */}
          <div className="p-container-margin border-b border-outline-variant">
            <PromoCodeInput promoCode={cart?.promo_code ?? null} onApply={onApplyPromo} onRemove={onRemovePromo} />
            <div className="mt-4">
              <PricingSummary pricing={cart?.pricing ?? null} promoCode={cart?.promo_code ?? null} />
            </div>
          </div>

          {/* Manual Discount Panel */}
          <div className="p-container-margin border-b border-outline-variant">
            <button
              onClick={() => setDiscountEnabled((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">local_offer</span>
                {t("pos.manualDiscount")}
              </span>
              <span className="material-symbols-outlined text-sm">{discountEnabled ? "expand_less" : "expand_more"}</span>
            </button>
            {discountEnabled && (
              <div className="mt-3 space-y-3 animate-fade-in">
                {/* Type toggle */}
                <div className="flex rounded-lg border border-outline-variant overflow-hidden">
                  <button
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${discountType === "PERCENTAGE" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-variant/20"}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType("FIXED")}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${discountType === "FIXED" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-variant/20"}`}
                  >
                    {t("pos.currencySymbol")}
                  </button>
                </div>
                {/* Value input */}
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">{discountType === "PERCENTAGE" ? "%" : t("pos.currencySymbol")}</span>
                  <input
                    type="number"
                    min={0}
                    max={discountType === "PERCENTAGE" ? DEFAULT_MAX_DISCOUNT_PCT : Math.min(DEFAULT_MAX_DISCOUNT_AMOUNT, totalDue)}
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface border border-outline-variant rounded-lg py-1.5 pr-8 pl-3 text-xs outline-none focus:border-primary"
                    placeholder={discountType === "PERCENTAGE" ? t("pos.placeholder.percent") : t("pos.placeholder.fixed")}
                  />
                </div>
                {computedDiscountAmount > 0 && (
                  <p className="text-[11px] text-secondary font-medium">{t("pos.discount")}: {formatCurrency(computedDiscountAmount)}</p>
                )}
                {/* Reason */}
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder={t("pos.discountReason")}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-1.5 px-3 text-xs outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="p-container-margin border-b border-outline-variant">
            <h3 className="text-xs font-semibold text-on-surface mb-3">{t("pos.cash")}</h3>

            {/* Cash Amount */}
            <div className="mb-3">
              <label className="text-[10px] text-outline font-medium mb-1.5 block">{t("pos.cash")}</label>
              <div className="relative mb-2">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-data-table">{t("pos.currencySymbol")}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={cashAmount || ""}
                  onChange={(e) => setCashAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2 pr-7 pl-3 text-sm outline-none focus:border-primary font-data-table"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCashAmount(Math.max(0, effectiveTotal - storeCreditAmount))}
                  className="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded-md border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {t("pos.exact")}
                </button>
                {[5, 10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashAmount(cashAmount + amt)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-surface-container-highest text-on-surface-variant rounded-md border border-outline-variant hover:bg-surface-container-high transition-colors"
                  >
                    +{t("pos.currencySymbol")}{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Store Credit Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-outline font-medium">{t("pos.storeCredit")}</label>
                {customer && (
                  <span className="text-[10px] text-secondary font-data-table">{t("storeCredit.balance")}: {formatCurrency(scBalance)}</span>
                )}
              </div>
              <div className="relative mb-2">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-data-table">{t("pos.currencySymbol")}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={storeCreditAmount || ""}
                  onChange={(e) => setStoreCreditAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={!customer}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2 pr-7 pl-3 text-sm outline-none focus:border-primary font-data-table disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder={customer ? "0.00" : t("customer.select")}
                />
              </div>
              {customer && scBalance > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setStoreCreditAmount(storeCreditAmount > 0 ? 0 : scBalance)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-secondary/10 text-secondary rounded-md border border-secondary/20 hover:bg-secondary/20 transition-colors"
                  >
                    {storeCreditAmount > 0 ? t("pos.removePromo") : t("common.all")}
                  </button>
                  {cashAmount > 0 && effectiveTotal > cashAmount && (
                    <button
                      onClick={() => setStoreCreditAmount(Math.min(effectiveTotal - cashAmount, scBalance))}
                      className="px-2.5 py-1 text-[10px] font-bold bg-surface-container-highest text-on-surface-variant rounded-md border border-outline-variant hover:bg-surface-container-high transition-colors"
                    >
                      {t("pos.storeCredit")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Totals */}
            <div className="mt-3 pt-3 border-t border-outline-variant space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("pos.pricing.totalDue")}</span>
                <span className="font-data-table text-on-surface">{formatCurrency(effectiveTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("pos.cash")}</span>
                <span className="font-data-table text-on-surface">{formatCurrency(cashAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">{t("pos.storeCredit")}</span>
                <span className="font-data-table text-secondary">{formatCurrency(storeCreditAmount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-outline-variant">
                <span className="text-on-surface font-semibold">{t("pos.change")}</span>
                <span className="font-data-table font-bold text-primary">
                  {formatCurrency(Math.max(0, cashAmount - Math.max(0, effectiveTotal - storeCreditAmount)))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: error + checkout button */}
        <div className="p-container-margin border-t border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-on-surface-variant">{t("pos.pricing.totalDue")}</span>
            <span className="font-data-table text-lg font-bold text-primary">{formatCurrency(effectiveTotal)}</span>
          </div>

          {displayError && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg mb-3">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{displayError}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={!canCheckout}
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                {t("common.saving")}
              </>
            ) : (
              <>
                <span>{t("pos.checkout")}</span>
                <span className="material-symbols-outlined">arrow_back</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customer Selector Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCustomerModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("customer.select")}</h3>
              <button onClick={() => setShowCustomerModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <CustomerSelector selected={customer} onSelect={(c) => { onCustomerChange(c); setShowCustomerModal(false); }} />
          </div>
        </div>
      )}
    </>
  );
}
