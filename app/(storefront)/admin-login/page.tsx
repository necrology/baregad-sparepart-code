"use client";

import Link from "next/link";
import { Suspense, type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withAppPath, withoutBasePath } from "@/shared/config/base-path";
import { useAdminSession } from "@/shared/runtime/app-runtime-provider";
import { Container } from "@/shared/ui/container";

function AdminLoginPageContent() {
  const searchParams = useSearchParams();
  const { session, isReady, isAuthenticating, login } = useAdminSession();
  const [error, setError] = useState("");
  const requestedNext = withoutBasePath(searchParams.get("next")?.trim() ?? "");
  const nextHref = requestedNext.startsWith("/")
    ? withAppPath(requestedNext)
    : withAppPath("/admin");

  useEffect(() => {
    if (!isReady || !session) {
      return;
    }

    window.location.replace(nextHref);
  }, [isReady, nextHref, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      setError("");

      await login({
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      window.location.replace(nextHref);
    } catch (loginError) {
      setError(
        loginError instanceof Error && loginError.message.trim()
          ? loginError.message
          : "Login admin gagal. Cek kembali username dan password.",
      );
    }
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md surface-panel rounded-[1.8rem] p-5 sm:p-6">
        <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
          Login Admin
        </span>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
          Masuk ke pengelolaan toko
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Gunakan akun admin untuk mengatur barang, pesanan, dan kebutuhan toko lainnya.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Username
            </span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Masukkan username admin"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Masukkan password admin"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          {error ? (
            <div className="rounded-[1.1rem] border border-[#d8e2ee] bg-[#24374d] px-4 py-3 text-sm leading-6 text-white">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full rounded-full border border-brand-deep bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(35,73,111,0.18)] transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
          >
            {isAuthenticating ? "Memeriksa akun..." : "Masuk Admin"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-3 inline-flex text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          Kembali ke toko
        </Link>
      </div>
    </Container>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
