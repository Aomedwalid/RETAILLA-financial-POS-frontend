"use client";

import { useCallback, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useSidebar } from "@/contexts/SidebarContext";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isOpen, isExpanded, isDesktop, close } = useSidebar();
  const mainRef = useRef<HTMLElement>(null);

  const handleBackdropClick = useCallback(() => {
    close();
  }, [close]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isDesktop && isOpen) {
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, isOpen, close]);

  useEffect(() => {
    if (!isDesktop && isOpen) {
      const focused = document.activeElement;
      const sidebar = document.getElementById("main-sidebar");
      if (sidebar) sidebar.focus();
      return () => {
        if (focused && focused instanceof HTMLElement) focused.focus();
      };
    }
  }, [isDesktop, isOpen]);

  return (
    <div className="flex h-dvh flex-col bg-surface-dim">
      <Sidebar />

      <TopBar />

      {!isDesktop && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <main
        ref={mainRef}
        id="main-content"
        className="flex-1 pt-16 overflow-y-auto transition-all duration-300 ease-in-out"
        style={isDesktop ? { marginRight: isExpanded ? "15rem" : "4rem" } : undefined}
        aria-hidden={!isDesktop && isOpen}
      >
        {children}
      </main>
    </div>
  );
}
