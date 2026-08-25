"use client";

import { AppLoadingBeacon } from "@/shared/ui/app-loading";

type AdminBusyOverlayProps = {
  visible: boolean;
  title: string;
  description?: string;
};

export function AdminBusyOverlay({
  visible,
  title,
  description,
}: AdminBusyOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#17324a]/28 px-4 backdrop-blur-[3px]">
      <div
        className="surface-strong relative w-full max-w-md overflow-hidden rounded-[1.8rem] p-5 shadow-[0_24px_80px_rgba(22,45,69,0.18)]"
        role="status"
        aria-live="polite"
      >
        <div className="app-loader-sheen absolute inset-x-0 top-0 h-px" />
        <div className="absolute -left-6 top-0 h-20 w-20 rounded-full bg-brand/10 blur-2xl" />
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-deep/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <AppLoadingBeacon compact />
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full border border-brand/10 bg-brand-soft/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep">
              Sedang diproses
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              {description ?? "Mohon tunggu sebentar, perubahan sedang diproses."}
            </p>
            <div className="mt-3 overflow-hidden rounded-full bg-brand-soft/70">
              <div className="app-loader-progress h-1.5 w-1/2 rounded-full bg-gradient-to-r from-brand via-brand-deep to-brand" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
