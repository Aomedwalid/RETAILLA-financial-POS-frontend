export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        <p className="text-on-surface-variant text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
}
