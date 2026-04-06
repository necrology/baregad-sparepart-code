"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/shared/ui/container";

const adminLoginUrl = process.env.NEXT_PUBLIC_ADMIN_LOGIN_URL?.trim() ?? "";

export function StaticAdminLoginBridge() {
  useEffect(() => {
    if (!adminLoginUrl) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.replace(adminLoginUrl);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md surface-panel rounded-[1.8rem] p-5 sm:p-6">
        <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
          Login Admin
        </span>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
          Akses panel admin dari static web
        </h1>

        {adminLoginUrl ? (
          <>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Anda sedang diarahkan ke panel admin yang berjalan di server agar login,
              sesi, dan manajemen data tetap sama seperti saat `run dev`.
            </p>
            <a
              href={adminLoginUrl}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-brand-deep bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(35,73,111,0.18)] transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Lanjut ke Login Admin
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Static export hanya membawa storefront. Agar tombol login tetap aktif,
              isi `NEXT_PUBLIC_ADMIN_LOGIN_URL` dengan URL panel admin yang memakai
              build server.
            </p>
            <div className="mt-5 rounded-[1.2rem] border border-line bg-white/80 px-4 py-3 text-xs leading-6 text-ink-soft">
              <code>NEXT_PUBLIC_ADMIN_LOGIN_URL=https://admin.example.com/admin-login</code>
            </div>
          </>
        )}

        <Link
          href="/"
          className="mt-3 inline-flex text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          Kembali ke storefront
        </Link>
      </div>
    </Container>
  );
}
