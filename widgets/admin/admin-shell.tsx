"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicAppConfig } from "@/shared/config/app";
import type { AdminSession } from "@/shared/auth/admin-auth";
import { adminSessionHasAccess } from "@/shared/auth/admin-access";
import { withAppPath } from "@/shared/config/base-path";
import { useAdminSession } from "@/shared/runtime/app-runtime-provider";
import { adminNavigation } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { CloseIcon } from "@/shared/ui/app-icons";
import { Container } from "@/shared/ui/container";

type AdminShellProps = {
  session: AdminSession;
  branding: PublicAppConfig;
  children: React.ReactNode;
};

type SidebarItemProps = {
  href: string;
  label: string;
  active?: boolean;
  subdued?: boolean;
  onNavigate?: () => void;
};

type AdminSidebarProps = {
  session: AdminSession;
  branding: PublicAppConfig;
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
  onClose?: () => void;
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
  active = false,
  subdued = false,
  onNavigate,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-[1.15rem] px-2.5 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-white/[0.12] text-white shadow-[0_14px_32px_rgba(0,0,0,0.16)]"
          : subdued
            ? "text-white/64 hover:bg-white/[0.06] hover:text-white"
            : "text-white/82 hover:bg-white/[0.06] hover:text-white",
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
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function BurgerButton({
  isOpen,
  label,
  onClick,
}: {
  isOpen: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={label}
      onClick={onClick}
      className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/80 text-ink lg:hidden"
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
  );
}

function AdminSidebar({
  session,
  branding,
  pathname,
  onNavigate,
  onLogout,
  onClose,
}: AdminSidebarProps) {
  const navigationItems = adminNavigation.filter((item) =>
    adminSessionHasAccess(session, {
      allowedRoles: [...item.roles],
      allowedLevelCodes:
        "levelCodes" in item && item.levelCodes ? [...item.levelCodes] : [],
    }),
  );

  const roleLabel =
    session.role === "admin"
      ? "Admin Utama"
      : session.levelName
        ? `Staff - ${session.levelName}`
        : "Staff Toko";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#202129]/95 p-2 text-white shadow-[0_28px_90px_rgba(11,14,28,0.42)] backdrop-blur-xl">
      <div className="flex items-start gap-3 border-b border-white/8 px-1 pb-2.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
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
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-[0.04em] text-white">
              {branding.adminPanelName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-white/48">
              {branding.adminPanelSubtitle}
            </span>
          </span>
        </Link>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            title="Tutup menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <div className="mt-3 rounded-[1.35rem] border border-white/8 bg-white/[0.05] px-3 py-3 text-sm leading-6 text-white/58">
        Gunakan filter di setiap halaman agar barang, pesanan, dan akun lebih cepat
        ditemukan.
      </div>

      <nav className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
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
              active={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <div className="mt-3 shrink-0 space-y-2 border-t border-white/8 pt-3">
        <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.05] p-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-sm font-bold text-white">
              {session.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {session.displayName}
              </p>
              <p className="truncate text-[11px] text-white/48">
                @{session.username}
              </p>
            </div>
          </div>
          <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white/72">
            {roleLabel}
          </span>
        </div>

        <SidebarItem
          href="/"
          label="Toko"
          subdued
          onNavigate={onNavigate}
        />

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-[1.15rem] px-2.5 py-2.5 text-sm font-semibold text-white/78 transition hover:bg-white/[0.06] hover:text-white"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/[0.08] text-[11px] font-bold tracking-[0.16em] text-white/82">
            KL
          </span>
          <span className="truncate">Keluar</span>
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ session, branding, children }: AdminShellProps) {
  const pathname = usePathname();
  const normalizedPathname =
    pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;
  const { logout } = useAdminSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setIsMobileMenuOpen((currentValue) => !currentValue);
  }

  function handleLogout() {
    logout();
    window.location.replace(withAppPath("/admin-login"));
  }

  return (
    <div key={pathname} className="min-h-screen overflow-x-hidden pb-3">
      <aside className="hidden lg:fixed lg:inset-y-3 lg:left-3 lg:z-40 lg:block lg:w-[252px]">
        <AdminSidebar
          session={session}
          branding={branding}
          pathname={normalizedPathname}
          onLogout={handleLogout}
        />
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-[#0d1622]/52 backdrop-blur-[3px]"
          />
          <div className="relative z-10 h-full w-[min(88vw,20rem)] p-3">
            <AdminSidebar
              session={session}
              branding={branding}
              pathname={normalizedPathname}
              onNavigate={() => setIsMobileMenuOpen(false)}
              onLogout={handleLogout}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[286px]">
        <Container className="space-y-3 py-2.5 sm:space-y-4 lg:px-4 lg:py-4">
          <header className="surface-panel rounded-[2rem] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <BurgerButton
                    isOpen={isMobileMenuOpen}
                    label={isMobileMenuOpen ? "Tutup menu admin" : "Buka menu admin"}
                    onClick={toggleMobileMenu}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                      {branding.adminWorkspaceLabel}
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
                      {branding.adminWorkspaceTitle}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      Login sebagai {session.displayName} (@{session.username})
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink-soft">
                  {session.role === "admin"
                    ? "Admin Utama"
                    : session.levelName
                      ? `Staff - ${session.levelName}`
                      : "Staff Toko"}
                </span>
              </div>
            </div>
          </header>

          {children}
        </Container>
      </div>
    </div>
  );
}
