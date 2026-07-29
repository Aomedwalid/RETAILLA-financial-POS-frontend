import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <span className="material-symbols-outlined text-outline text-6xl">error_outline</span>
        <h1 className="text-headline-lg font-bold text-on-surface">الصفحة غير موجودة</h1>
        <p className="text-on-surface-variant">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 transition-all"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
