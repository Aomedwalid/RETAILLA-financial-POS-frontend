"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import useClickOutside from "@/lib/hooks/useClickOutside";
import UserMenu from "./UserMenu";
import { useTranslation } from "react-i18next";

export default function TopBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toggle, isOpen, isExpanded, isDesktop } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useClickOutside(searchRef, searchOpen && !isDesktop, () => setSearchOpen(false));

  function handleSearchToggle() {
    setSearchOpen((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return !prev;
    });
  }

  return (
    <header
      className={`
        fixed top-0 h-16 z-40
        bg-background border-b border-outline-variant
        flex items-center justify-between
        px-3 md:px-container-margin
        transition-all duration-300 ease-in-out
      `}
      style={isDesktop ? { left: 0, right: isExpanded ? "15rem" : "4rem" } : { left: 0, right: 0 }}
    >
      {/* Left */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Hamburger (mobile/tablet) */}
        <button
          onClick={toggle}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors text-on-surface-variant"
          aria-label={t("nav.toggleNavigation")}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Search - desktop */}
        <div className="hidden lg:block relative w-80">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            placeholder={t("search.global")}
            className="w-full bg-surface-container-low border border-outline-variant rounded-full py-1.5 ps-10 pe-4 text-body-md outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Search - mobile (collapsible) */}
        <div ref={searchRef} className={`lg:hidden ${searchOpen ? "flex-1" : ""}`}>
          {searchOpen ? (
            <div className="relative flex-1 max-w-full">
              <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("search.placeholder")}
                className="w-full bg-surface-container-low border border-outline-variant rounded-full py-1.5 ps-10 pe-4 text-body-md outline-none focus:border-primary transition-colors"
              />
            </div>
          ) : (
            <button
              onClick={handleSearchToggle}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors text-on-surface-variant"
              aria-label={t("search.open")}
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          )}
        </div>

        {/* Location badge (hide on small mobile) */}
        <nav className="hidden md:flex items-center gap-2">
          <span className="font-label-caps text-label-caps text-secondary border-b-2 border-secondary pb-1 whitespace-nowrap">
            {t("location.main")}
          </span>
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button
          onClick={() => router.push("/pos")}
          className="flex items-center gap-2 bg-primary-container text-on-primary-container px-3 md:px-4 py-2 rounded-lg font-bold text-label-caps active:scale-95 transition-transform whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">{t("sale.new")}</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
