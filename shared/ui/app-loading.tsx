import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui/container";

type AppLoadingBeaconProps = {
  className?: string;
  compact?: boolean;
};

type AppLoadingCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  compact?: boolean;
};

type AppRouteLoadingProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
};

export function AppLoadingBeacon({
  className,
  compact = false,
}: AppLoadingBeaconProps) {
  return (
    <span
      className={cn(
        "app-loader-beacon relative inline-flex shrink-0 items-center justify-center rounded-full",
        compact ? "h-11 w-11" : "h-14 w-14",
        className,
      )}
      aria-hidden="true"
    >
      <span className="app-loader-ring absolute inset-0 rounded-full border border-brand/20" />
      <span className="app-loader-ring-delay absolute inset-[0.35rem] rounded-full border border-brand-deep/18" />
      <span className="absolute inset-[0.55rem] rounded-full bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
      <span className="absolute h-3.5 w-3.5 rounded-full bg-gradient-to-br from-brand to-brand-deep shadow-[0_0_0_6px_rgba(77,135,187,0.12)]" />
      <span className="app-loader-dot absolute top-1.5 h-2.5 w-2.5 rounded-full bg-brand-deep/70" />
      <span className="app-loader-dot-delay absolute bottom-1.5 h-2 w-2 rounded-full bg-brand/55" />
    </span>
  );
}

export function AppLoadingCard({
  title,
  description = "Mohon tunggu sebentar, kami sedang menyiapkan tampilan terbaru untuk Anda.",
  eyebrow = "Sedang memuat",
  className,
  compact = false,
}: AppLoadingCardProps) {
  return (
    <div
      className={cn(
        "surface-panel relative overflow-hidden rounded-[1.9rem] px-5 py-5 shadow-[0_24px_80px_rgba(38,74,112,0.12)]",
        compact ? "max-w-xl" : "",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-deep/10 blur-3xl" />
        <div className="app-loader-sheen absolute inset-x-0 top-0 h-px" />
      </div>

      <div className="relative flex items-start gap-4">
        <AppLoadingBeacon compact={compact} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-brand/10 bg-brand-soft/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-deep">
            {eyebrow}
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
            {description}
          </p>

          <div className="mt-4 space-y-2.5">
            <div className="app-loader-shimmer h-2.5 w-full max-w-xl rounded-full" />
            <div className="app-loader-shimmer h-2.5 w-[82%] rounded-full" />
            <div className="app-loader-shimmer h-2.5 w-[58%] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppRouteLoading({
  title = "Sedang menyiapkan halaman",
  description = "Navigasi sedang diproses. Konten baru akan muncul sesaat lagi dengan data yang paling baru.",
  eyebrow = "Memuat halaman",
}: AppRouteLoadingProps) {
  return (
    <Container className="py-6 sm:py-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.8fr)]">
        <AppLoadingCard title={title} description={description} eyebrow={eyebrow} />

        <div className="space-y-4">
          <div className="surface-panel relative overflow-hidden rounded-[1.9rem] p-4">
            <div className="app-loader-sheen absolute inset-x-0 top-0 h-px" />
            <div className="app-loader-shimmer h-3 w-24 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="app-loader-shimmer h-12 rounded-[1.3rem]" />
              <div className="app-loader-shimmer h-12 rounded-[1.3rem]" />
              <div className="app-loader-shimmer h-12 rounded-[1.3rem]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="surface-strong app-loader-sheen relative h-24 overflow-hidden rounded-[1.5rem] p-4"
              >
                <div className="app-loader-shimmer h-3 w-14 rounded-full" />
                <div className="mt-5 app-loader-shimmer h-8 w-20 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
