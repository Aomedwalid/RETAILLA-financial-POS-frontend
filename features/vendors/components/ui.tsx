"use client";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-2">
        <span className="w-1 h-3 rounded-full bg-primary/60 shrink-0" />
        {title}
      </h4>
      {children}
    </div>
  );
}
