"use client";

import { type ReactNode } from "react";
import "@/lib/i18n/config";

export default function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
