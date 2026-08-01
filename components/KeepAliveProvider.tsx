"use client";

import { useEffect } from "react";
import { startKeepAlive, stopKeepAlive } from "@/lib/keep-alive";

export default function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  return <>{children}</>;
}
