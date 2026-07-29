import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات | Retaila",
};

function SettingsContent() {
  return (
    <div className="text-center max-w-md">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
        <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          settings
        </span>
      </div>
      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">الإعدادات</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
        صفحة الإعدادات قيد التطوير حالياً. سيتمكن المديرون من تخصيص المتجر، وإدارة المستخدمين،
        وضبط الإشعارات، وتحديث إعدادات الأمان والفوترة من مكان واحد.
      </p>
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2.5">
        <span className="material-symbols-outlined text-primary text-sm">construction</span>
        <span className="text-primary font-bold text-sm">قريبًا</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-container-margin flex-1 overflow-y-auto flex items-center justify-center" style={{ scrollbarWidth: "none" }}>
      <SettingsContent />
    </div>
  );
}
