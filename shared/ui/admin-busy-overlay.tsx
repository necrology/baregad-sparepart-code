"use client";

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
        className="surface-strong flex w-full max-w-md items-center gap-4 rounded-[1.8rem] p-5 shadow-[0_24px_80px_rgba(22,45,69,0.18)]"
        role="status"
        aria-live="polite"
      >
        <span className="inline-flex h-12 w-12 shrink-0 animate-spin rounded-full border-[3px] border-brand/15 border-t-brand" />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            {description ?? "Mohon tunggu sebentar, perubahan sedang diproses."}
          </p>
        </div>
      </div>
    </div>
  );
}
