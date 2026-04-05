import Link from "next/link";
import { Container } from "@/shared/ui/container";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center py-16">
      <Container className="w-full">
        <div className="surface-panel noise-overlay rounded-[2rem] p-8 text-center sm:p-12">
          <span className="inline-flex rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-deep">
            Halaman tidak ditemukan
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold text-ink sm:text-5xl">
            Rute yang Anda cari belum tersedia.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">
            Silakan kembali ke beranda atau buka katalog untuk melanjutkan pencarian
            produk yang Anda butuhkan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Ke Beranda
            </Link>
            <Link
              href="/katalog"
              className="rounded-full border border-line-strong px-6 py-3 font-semibold text-ink transition hover:bg-white/60"
            >
              Buka Katalog
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
