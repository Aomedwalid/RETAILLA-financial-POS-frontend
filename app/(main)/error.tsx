"use client";

import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <span className="material-symbols-outlined text-error text-5xl">error_outline</span>
        <h2 className="text-headline-md font-bold text-on-surface">حدث خطأ</h2>
        <p className="text-on-surface-variant text-sm">حدث خطأ غير متوقع في لوحة التحكم.</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
