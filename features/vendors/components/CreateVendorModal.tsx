"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { vendorsApi } from "@/features/vendors/api";
import type { CreateVendorRequest } from "@/features/vendors/types";

interface CreateVendorModalProps {
  onCreated: () => void;
}

export default function CreateVendorModal({ onCreated }: CreateVendorModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [terms, setTerms] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) { setError(t("validation.required")); return; }
    setError("");
    setSubmitting(true);
    try {
      const body: CreateVendorRequest = { name: name.trim() };
      if (contactName.trim()) body.contact_name = contactName.trim();
      if (contactEmail.trim()) body.contact_email = contactEmail.trim();
      if (contactPhone.trim()) body.contact_phone = contactPhone.trim();
      const t = parseInt(terms, 10);
      if (t > 0) body.payment_terms_days = t;
      await vendorsApi.create(body);
      setOpen(false);
      setName(""); setContactName(""); setContactEmail(""); setContactPhone(""); setTerms("30");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendor.failedToCreate"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 active:scale-95">
        <span className="material-symbols-outlined text-sm">add</span>
        {t("vendor.create")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-[95vw] md:w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("vendor.create")}</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label={`${t("common.name")} *`}>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder="Acme Supplies" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t("vendor.contactPerson")}>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder="John Doe" />
                </Field>
                <Field label={t("vendor.paymentTermsDays")}>
                  <input type="number" min="0" value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" />
                </Field>
              </div>
              <Field label={t("common.email")}>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder="john@acme.com" />
              </Field>
              <Field label={t("common.phone")}>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-outline/30 bg-surface-container-high text-on-surface text-sm outline-none focus:border-primary" placeholder="+1234567890" />
              </Field>
              {error && <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
              <button onClick={() => setOpen(false)} disabled={submitting} className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-variant/20">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                {submitting && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                {submitting ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1 block">{label}</label>
      {children}
    </div>
  );
}