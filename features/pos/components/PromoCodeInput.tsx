"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PromoCodeInputProps {
  promoCode: string | null;
  onApply: (code: string) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

export default function PromoCodeInput({ promoCode, onApply, onRemove }: PromoCodeInputProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onApply(code.trim());
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("pos.invalidPromo"));
    } finally { setLoading(false); }
  }

  async function handleRemove() {
    setLoading(true);
    setError("");
    try { await onRemove(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("common.somethingWentWrong")); }
    finally { setLoading(false); }
  }

  if (promoCode) {
    return (
      <div className="flex items-center justify-between bg-secondary/10 border border-secondary/30 rounded-lg px-3 py-2">
        <span className="text-xs font-semibold text-secondary">{promoCode}</span>
        <button onClick={handleRemove} disabled={loading} className="text-[11px] text-error hover:underline disabled:opacity-50">
          {loading ? "..." : t("pos.removePromo")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder={t("pos.promoCode")}
          className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-0 outline-none"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-surface-container-highest border border-outline-variant rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          {loading ? "..." : t("pos.applyPromo")}
        </button>
      </div>
      {error && <p className="text-[11px] text-error mt-1">{error}</p>}
    </div>
  );
}
