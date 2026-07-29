"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import useMediaQuery from "@/lib/hooks/useMediaQuery";

interface SidebarContextValue {
  isOpen: boolean;
  isExpanded: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setExpanded: (v: boolean) => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, isOpen]);

  const toggle = useCallback(() => {
    if (isDesktop) {
      setIsExpanded((prev) => !prev);
    } else {
      setIsOpen((prev) => !prev);
    }
  }, [isDesktop]);

  const open = useCallback(() => {
    if (!isDesktop) setIsOpen(true);
  }, [isDesktop]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setExpanded = useCallback((v: boolean) => {
    setIsExpanded(v);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, isExpanded, toggle, open, close, setExpanded, isDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
