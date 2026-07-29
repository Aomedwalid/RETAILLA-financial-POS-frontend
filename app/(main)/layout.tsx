"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { DateRangeProvider } from "@/lib/filters/DateRangeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AppShell from "@/components/layout/AppShell";
import { AppShellSkeleton } from "@/components/layout/AppShellSkeleton";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isLoading, router]);

  if (isLoading) return <AppShellSkeleton />;
  if (!accessToken) return null;

  return (
    <SidebarProvider>
      <AppShell>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <DateRangeProvider>
        <AuthGate>
          {children}
        </AuthGate>
      </DateRangeProvider>
    </Suspense>
  );
}
