"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTranslation } from "react-i18next";

interface NavItem {
  href: string;
  icon: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", labelKey: "nav.dashboard" },
  { href: "/pos", icon: "point_of_sale", labelKey: "nav.pos" },
  { href: "/products", icon: "inventory_2", labelKey: "nav.products" },
  { href: "/discounts", icon: "sell", labelKey: "nav.discounts" },
  { href: "/customers", icon: "group", labelKey: "nav.customers" },
  { href: "/store-credit", icon: "payments", labelKey: "nav.storeCredit" },
  { href: "/money", icon: "savings", labelKey: "nav.money" },
  { href: "/budgets", icon: "account_balance_wallet", labelKey: "nav.budgets" },
  { href: "/expenses", icon: "receipt_long", labelKey: "nav.expenses" },
  { href: "/vendors", icon: "conveyor_belt", labelKey: "nav.vendors" },
  { href: "/reconciliation", icon: "account_balance", labelKey: "nav.reconciliation" },
  { href: "/team", icon: "badge", labelKey: "nav.team" },
  { href: "/settings", icon: "settings", labelKey: "nav.settings" },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isOpen, isExpanded, isDesktop, toggle, close, setExpanded } = useSidebar();

  function handleNavClick() {
    if (!isDesktop) close();
  }

  function handleToggle() {
    if (isDesktop) toggle();
  }

  return (
    <aside
      id="main-sidebar"
      role="navigation"
      aria-label={t("nav.mainNavigation")}
      aria-expanded={isDesktop ? isExpanded : isOpen}
      tabIndex={-1}
      className={`
        fixed right-0 top-0 h-screen z-50
        bg-surface border-l border-outline-variant
        flex flex-col py-container-margin
        transition-all duration-300 ease-in-out
        outline-none

        ${isDesktop
          ? `${isExpanded ? "w-60 px-stack-md" : "w-16 px-3"}`
          : `w-60 px-stack-md ${isOpen ? "translate-x-0" : "translate-x-full"}`
        }
      `}
    >
      {/* Brand */}
      <div className={`mb-8 flex items-center ${isDesktop && !isExpanded ? "justify-center px-0" : "px-2 gap-3"}`}>
        <Image src="/logo.png" alt="Logo" width={64} height={64} className="shrink-0 object-contain" priority />
        <div className={`overflow-hidden transition-all duration-300 ${isDesktop && !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary whitespace-nowrap">{t("app.name")}</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold whitespace-nowrap">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`
                flex items-center rounded-lg transition-all duration-200
                ${isDesktop && !isExpanded ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}
                ${isActive
                  ? "text-primary font-bold border-s-2 border-primary bg-surface-container-high"
                  : "text-on-surface-variant font-medium hover:bg-surface-container-high"
                }
              `}
              title={isDesktop && !isExpanded ? t(item.labelKey) : undefined}
            >
              <span
                className="material-symbols-outlined shrink-0"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isDesktop && !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Toggle + Switch Store */}
      <div className="mt-auto pt-6 border-t border-outline-variant space-y-3">
        {isDesktop && (
          <button
            onClick={handleToggle}
            className={`
              flex items-center rounded-lg transition-all duration-200 cursor-pointer
              text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
              ${isExpanded ? "gap-3 px-3 py-2.5 w-full" : "justify-center px-0 py-2.5 w-full"}
            `}
            title={isExpanded ? t("nav.collapseSidebar") : t("nav.expandSidebar")}
            aria-label={isExpanded ? t("nav.collapseSidebar") : t("nav.expandSidebar")}
          >
            <span className="material-symbols-outlined shrink-0">
              {isExpanded ? "chevron_right" : "chevron_left"}
            </span>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-label-caps font-label-caps ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
              {t("nav.collapse")}
            </span>
          </button>
        )}

        <div className={isDesktop && !isExpanded ? "px-0" : "px-2"}>
          <button className="w-full py-2 bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all active:scale-[0.95]">
            <span className="material-symbols-outlined text-[18px] shrink-0">sync_alt</span>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-label-caps font-label-caps ${isDesktop && !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              {t("nav.switchStore")}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
