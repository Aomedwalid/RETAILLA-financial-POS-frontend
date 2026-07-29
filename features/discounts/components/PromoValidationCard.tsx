"use client";

import { useState } from "react";
import { promoCodesApi } from "../api";
import type { PromoValidationResult } from "../types";

export default function PromoValidationCard() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PromoValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleValidate() {
    if (!code.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await promoCodesApi.validate(code.trim());
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-card-padding space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined">verified</span>
        <h4 className="font-headline-sm text-headline-sm text-on-surface">Validate Promo Code</h4>
      </div>
      <p className="text-sm text-on-surface-variant">
        Quickly check the validity of any customer-presented promotional code.
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          placeholder="Enter promo code..."
          className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 text-body-md outline-none focus:ring-1 focus:ring-primary transition-colors font-data-table"
          maxLength={30}
        />
        <button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          {loading ? "Checking..." : "Validate"}
        </button>
      </div>
      {result && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            result.valid
              ? "bg-secondary/10 border-secondary/20 text-secondary"
              : "bg-error/10 border-error/20 text-error"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {result.valid ? "check_circle" : "cancel"}
          </span>
          <div>
            <p className="font-semibold text-sm">
              {result.valid ? `${code} is valid` : `${code} is invalid`}
            </p>
            {result.reason && (
              <p className="text-xs opacity-80 mt-0.5">{result.reason}</p>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3.5 py-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
