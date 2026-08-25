"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicAppConfig } from "@/shared/config/app";
import { storefrontNavigation } from "@/shared/config/navigation";
import { Container } from "@/shared/ui/container";
import { Logo } from "@/shared/ui/logo";
import { StorefrontSearch } from "@/widgets/storefront/storefront-search";

type StorefrontHeaderProps = {
  branding: PublicAppConfig;
  showAdminLogin?: boolean;
};

export function StorefrontHeader({
  branding,
  showAdminLogin = true,
}: StorefrontHeaderProps) {
  const pathname = usePathname();
  const normalizedPathname =
    pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;
  const [mobileMenuPathname, setMobileMenuPathname] = useState<string | null>(null);
  const isOpen = mobileMenuPathname === normalizedPathname;

  function toggleMobileMenu() {
    setMobileMenuPathname((currentValue) =>
      currentValue === normalizedPathname ? null : normalizedPathname,
    );
  }

  function closeMobileMenu() {
    setMobileMenuPathname(null);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    function syncMenuState(event: MediaQueryList | MediaQueryListEvent) {
      if (event.matches) {
        setMobileMenuPathname(null);
      }
    }

    syncMenuState(mediaQuery);
    mediaQuery.addEventListener("change", syncMenuState);

    return () => {
      mediaQuery.removeEventListener("change", syncMenuState);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/88 backdrop-blur-xl">
      <Container>
        <div className="flex items-center justify-between gap-2 py-2">
          <Logo branding={branding} />

          <nav className="hidden items-center gap-1.5 rounded-full border border-line bg-white/70 px-2 py-1.5 lg:flex">
            {storefrontNavigation.map((item) => {
              const targetPath = item.href.split("?")[0];
              const isActive =
                targetPath === "/"
                  ? normalizedPathname === "/"
                  : normalizedPathname.startsWith(targetPath);
              const itemHref = item.href;

              return (
                <Link
                  key={item.href}
                  href={itemHref}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-brand text-white hover:text-white focus-visible:text-white"
                      : "text-ink-soft hover:bg-brand-soft hover:text-brand-deep"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            onClick={toggleMobileMenu}
            className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/80 text-ink lg:hidden"
          >
            <span className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          {showAdminLogin ? (
            <Link
              href="/admin-login"
              className="hidden rounded-full border border-brand-deep bg-brand px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(56,110,156,0.18)] transition hover:bg-brand-deep hover:text-white focus-visible:text-white lg:inline-flex"
            >
              Login Admin
            </Link>
          ) : null}
        </div>

        {isOpen ? (
          <div className="pb-3 lg:hidden">
            <div className="surface-panel rounded-[1.25rem] p-2.5">
              <div className="flex flex-col gap-2">
                {storefrontNavigation.map((item) => {
                  const targetPath = item.href.split("?")[0];
                  const isActive =
                    targetPath === "/"
                      ? normalizedPathname === "/"
                      : normalizedPathname.startsWith(targetPath);
                  const itemHref = item.href;

                  return (
                    <Link
                      key={item.href}
                      href={itemHref}
                      onClick={closeMobileMenu}
                      className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-brand text-white hover:text-white focus-visible:text-white"
                          : "bg-white/70 text-ink-soft hover:bg-brand-soft hover:text-brand-deep"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {showAdminLogin ? (
                  <Link
                    href="/admin-login"
                    onClick={closeMobileMenu}
                    className="inline-flex justify-center rounded-xl border border-brand-deep bg-brand px-3 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(56,110,156,0.18)] transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
                  >
                    Login Admin
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="pb-3">
          <StorefrontSearch
            placeholder="Cari nama barang, brand, SKU, atau kode motor"
          />
        </div>
      </Container>
    </header>
  );
}
