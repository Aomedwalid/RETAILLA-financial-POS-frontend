"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, isLoading, router]);

  if (isLoading) return null;

  if (accessToken) return null;

  return <>{children}</>;
}
