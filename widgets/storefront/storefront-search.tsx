"use client";

import { useId } from "react";
import { cn } from "@/shared/lib/cn";
import { SearchIcon } from "@/shared/ui/app-icons";

type StorefrontSearchProps = {
  variant?: "header" | "hero";
  placeholder?: string;
  helperText?: string;
  className?: string;
};

export function StorefrontSearch({
  variant = "header",
  placeholder = "Cari semua barang di toko",
  helperText,
  className,
}: StorefrontSearchProps) {
  const inputId = useId();
  const isHero = variant === "hero";

  return (
    <div className={cn("space-y-2", className)}>
      <form
        action="/katalog"
        role="search"
        className={cn(
          "flex items-center gap-2 border border-line bg-white/80 backdrop-blur-sm",
          isHero
            ? "rounded-[1.6rem] p-2 shadow-[0_16px_36px_rgba(36,72,110,0.12)]"
            : "rounded-[1.2rem] p-1.5",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Cari barang di store
        </label>
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-[1rem] bg-canvas-strong/80",
            isHero ? "px-4 py-3" : "px-3 py-2.5",
          )}
        >
          <SearchIcon className={cn("shrink-0 text-muted", isHero ? "h-5 w-5" : "h-4 w-4")} />
          <input
            id={inputId}
            name="q"
            placeholder={placeholder}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted",
              isHero ? "text-sm sm:text-base" : "text-sm",
            )}
          />
        </div>
        <button
          type="submit"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-[1rem] bg-brand font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white",
            isHero ? "px-4 py-3 text-sm" : "px-3 py-2.5 text-sm",
          )}
        >
          <SearchIcon className={isHero ? "h-4 w-4" : "h-4 w-4"} />
          <span className={cn(isHero ? "inline" : "hidden sm:inline")}>Cari</span>
        </button>
      </form>

      {helperText ? (
        <p className={cn("text-ink-soft", isHero ? "text-xs sm:text-sm" : "text-xs")}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
