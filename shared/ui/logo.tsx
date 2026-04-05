import Link from "next/link";
import type { PublicAppConfig } from "@/shared/config/app";
import { cn } from "@/shared/lib/cn";

type LogoProps = {
  branding: PublicAppConfig;
  className?: string;
  compact?: boolean;
};

function createInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Logo({ branding, className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 text-ink", className)}
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-white/95 shadow-[0_8px_20px_rgba(33,71,111,0.14)] sm:h-10 sm:w-10">
        {branding.logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl}
              alt={`${branding.appShortName} logo`}
              className="h-full w-full object-cover"
            />
          </>
        ) : (
          <span className="text-xs font-bold tracking-[0.16em] text-ink">
            {createInitials(branding.appShortName)}
          </span>
        )}
      </span>
      {!compact ? (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold sm:text-base">
            {branding.appName}
          </span>
          <span className="text-[10px] text-ink-soft sm:text-xs">
            {branding.brandCategoryLabel}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
