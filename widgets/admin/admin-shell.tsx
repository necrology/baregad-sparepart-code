"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicAppConfig } from "@/shared/config/app";
import type { AdminSession } from "@/shared/auth/admin-auth";
import { adminSessionHasAccess } from "@/shared/auth/admin-access";
import { adminNavigation } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui/container";

type AdminShellProps = {
  session: AdminSession;
  branding: PublicAppConfig;
  children: React.ReactNode;
};

type SidebarItemProps = {
  href: string;
  label: string;
  collapsed: boolean;
  active?: boolean;
  subdued?: boolean;
};

function createNavBadge(label: string) {
  return label
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SidebarItem({
  href,
  label,
  collapsed,
  active = false,
  subdued = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "group relative flex items-center rounded-[1.15rem] px-2 py-2 text-sm font-semibold transition",
        active
          ? "bg-white/[0.12] text-white shadow-[0_14px_32px_rgba(0,0,0,0.16)]"
          : subdued
            ? "text-white/64 hover:bg-white/[0.06] hover:text-white"
            : "text-white/78 hover:bg-white/[0.06] hover:text-white",
        collapsed ? "lg:justify-center" : "gap-3",
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] text-[11px] font-bold tracking-[0.16em]",
          active ? "bg-white text-[#1f2129]" : "bg-white/[0.08] text-white/82",
        )}
      >
        {createNavBadge(label)}
      </span>
      <span className={cn("min-w-0 truncate", collapsed ? "lg:hidden" : "")}>
        {label}
      </span>
      {collapsed ? (
        <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 rounded-xl border border-white/10 bg-[#1f2129] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-[0_18px_44px_rgba(0,0,0,0.34)] transition group-hover:lg:flex group-hover:lg:opacity-100">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminShell({ session, branding, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  function toggleSidebar() {
    setIsCollapsed((currentValue) => !currentValue);
  }

  const navigationItems = adminNavigation.filter((item) =>
    adminSessionHasAccess(session, {
      allowedRoles: [...item.roles],
      allowedLevelCodes:
        "levelCodes" in item && item.levelCodes ? [...item.levelCodes] : [],
    }),
  );
  const toggleLabel = isCollapsed ? "Perluas sidebar" : "Kecilkan sidebar";
  const roleLabel =
    session.role === "admin"
      ? "Admin Sistem"
      : session.levelName
        ? `Staff - ${session.levelName}`
        : "Staff Dashboard";

  return (
    <div className="min-h-screen pb-3">
      <aside
        className={cn(
          "mx-2.5 mt-2.5 lg:mx-0 lg:mt-0 lg:fixed lg:top-3 lg:bottom-3 lg:left-3 lg:z-40 transition-[width] duration-300",
          isCollapsed ? "lg:w-[84px]" : "lg:w-[252px]",
        )}
      >
        <div className="relative flex h-full max-h-[min(78vh,42rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#202129]/95 p-2 text-white shadow-[0_28px_90px_rgba(11,14,28,0.42)] backdrop-blur-xl lg:max-h-none">
          <div className="flex items-center gap-2.5 border-b border-white/8 px-1 pb-2.5">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-white/12 bg-white/[0.08]">
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
                  <span className="text-xs font-bold tracking-[0.16em] text-white">
                    {branding.appShortName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <span className={cn("min-w-0", isCollapsed ? "lg:hidden" : "")}>
                <span className="block truncate text-sm font-semibold tracking-[0.04em] text-white">
                  {branding.adminPanelName}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-white/48">
                  {branding.adminPanelSubtitle}
                </span>
              </span>
            </Link>
          </div>

          <div
            className={cn(
              "mt-2 flex px-1",
              isCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "inline-flex h-9 items-center rounded-full border border-[#323540] bg-[#17181f] px-1 text-white shadow-[0_18px_42px_rgba(0,0,0,0.36)] transition-[width,background-color] duration-300 hover:bg-[#1f212a]",
                isCollapsed ? "w-9 justify-center" : "w-[68px] justify-start",
              )}
              aria-expanded={!isCollapsed}
              aria-label={toggleLabel}
              title={toggleLabel}
            >
              <span className="relative flex h-7 w-full items-center">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#17181f] shadow-[0_8px_18px_rgba(255,255,255,0.18)] transition-transform duration-300",
                    isCollapsed ? "translate-x-0" : "translate-x-[32px]",
                  )}
                >
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      isCollapsed
                        ? "h-3 w-3 bg-[#17181f]"
                        : "h-3 w-3 bg-brand-deep",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "pointer-events-none absolute right-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58 transition-opacity duration-200",
                    isCollapsed ? "opacity-0" : "opacity-100",
                  )}
                >
                  On
                </span>
              </span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn("mt-2.5", isCollapsed ? "lg:hidden" : "")}>
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.05] px-2.5 py-2.5 text-sm text-white/55">
                Gunakan filter di setiap halaman untuk mencari produk, pesanan,
                dan user lebih cepat.
              </div>
            </div>

            <nav className="mt-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    collapsed={isCollapsed}
                    active={isActive}
                  />
                );
              })}
            </nav>
          </div>

          <div className="mt-2.5 shrink-0 space-y-1 border-t border-white/8 pt-2.5">
            <SidebarItem
              href="/"
              label="Storefront"
              collapsed={isCollapsed}
              subdued
            />

            <form
              action="/api/admin-auth/logout"
              method="post"
              className="group relative"
            >
              <button
                type="submit"
                title="Keluar"
                className={cn(
                  "flex w-full items-center rounded-[1.15rem] px-2 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/[0.06] hover:text-white",
                  isCollapsed ? "lg:justify-center" : "gap-3",
                )}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/[0.08] text-[11px] font-bold tracking-[0.16em] text-white/82">
                  KL
                </span>
                <span
                  className={cn("truncate", isCollapsed ? "lg:hidden" : "")}
                >
                  Keluar
                </span>
              </button>
              {isCollapsed ? (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 rounded-xl border border-white/10 bg-[#1f2129] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-[0_18px_44px_rgba(0,0,0,0.34)] transition group-hover:lg:flex group-hover:lg:opacity-100">
                  Keluar
                </span>
              ) : null}
            </form>

            <div
              className={cn(
                "mt-2.5 rounded-[1.45rem] border border-white/8 bg-white/[0.05] p-2",
                isCollapsed ? "lg:px-1.5 lg:py-2" : "",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isCollapsed ? "lg:justify-center" : "",
                )}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-sm font-bold text-white">
                  {session.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div className={cn("min-w-0", isCollapsed ? "lg:hidden" : "")}>
                  <p className="truncate text-sm font-semibold text-white">
                    {session.displayName}
                  </p>
                  <p className="truncate text-[11px] text-white/48">
                    @{session.username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "transition-[padding-left] duration-300",
          isCollapsed ? "lg:pl-[104px]" : "lg:pl-[286px]",
        )}
      >
        <Container className="space-y-3 py-2.5 sm:space-y-4 lg:px-4 lg:py-4">
          <header className="surface-panel rounded-[2rem] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                  {branding.adminWorkspaceLabel}
                </p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
                  {branding.adminWorkspaceTitle}
                </h1>
                <p className="mt-2 text-sm text-ink-soft">
                  Login sebagai {session.displayName} (@{session.username})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink-soft">
                  {roleLabel}
                </span>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="rounded-full border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-white/70 lg:hidden"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? "Perluas Sidebar" : "Kecilkan Sidebar"}
                </button>
              </div>
            </div>
          </header>
          {children}
        </Container>
      </div>
    </div>
  );
}
