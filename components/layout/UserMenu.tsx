"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import useClickOutside from "@/lib/hooks/useClickOutside";
import { useTranslation } from "react-i18next";

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, isOpen, close);

  const displayName = user?.full_name || user?.email || "";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // ignore
    }
    router.push("/login");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">person</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-72 bg-surface-container-high rounded-xl border border-outline-variant shadow-2xl z-50 overflow-hidden animate-scale-in">
          {user && (
            <div className="px-4 py-4 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-[24px]">person</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface truncate">{displayName}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {t(`userMenu.role.${user.role}`, user.role)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="py-2 px-4">
            {user && (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">shield</span>
                  <span>{t(`userMenu.role.${user.role}`, user.role)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
                  <span className="truncate">{user.tenant_name || user.tenant_id}</span>
                </div>
              </div>
            )}

            <div className="border-t border-outline-variant my-2" />

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-2 py-2.5 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
            >
              {loggingOut ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">logout</span>
              )}
              <span>{loggingOut ? t("userMenu.loggingOut") : t("userMenu.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
