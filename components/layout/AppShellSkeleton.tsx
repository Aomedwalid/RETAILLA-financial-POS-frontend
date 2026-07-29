export function AppShellSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-surface-dim">
      <header className="fixed top-0 h-16 z-40 bg-background border-b border-outline-variant left-0 right-0 flex items-center justify-between px-3 md:px-container-margin">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <div className="lg:hidden w-10 h-10 rounded-full bg-surface-container-highest/60 animate-pulse" />
          <div className="hidden lg:block w-80 h-9 rounded-full bg-surface-container-low border border-outline-variant animate-pulse" />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest/60 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-surface-container-highest/60 animate-pulse" />
        </div>
      </header>
      <main className="flex-1 pt-16 overflow-y-auto p-container-margin">
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-surface-container-highest/60 animate-pulse" />
          <div className="grid grid-cols-12 gap-gutter">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 bg-surface-container-low rounded-xl border border-outline-variant p-card-padding animate-pulse"
              >
                <div className="h-3 w-20 rounded bg-surface-container-highest/60 mb-4" />
                <div className="h-8 w-36 rounded bg-surface-container-highest/60" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-xl bg-surface-container-low border border-outline-variant animate-pulse" />
        </div>
      </main>
    </div>
  );
}
