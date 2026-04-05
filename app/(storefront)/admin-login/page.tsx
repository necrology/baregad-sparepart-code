import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/auth/admin-auth";
import { Container } from "@/shared/ui/container";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md surface-panel rounded-[1.8rem] p-5 sm:p-6">
        <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
          Login Admin
        </span>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
          Masuk ke area pengelolaan toko
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Gunakan username dan password admin untuk membuka dashboard pengelolaan.
        </p>

        <form action="/api/admin-auth/login" method="post" className="mt-5 space-y-3">
          <input type="hidden" name="next" value="/admin" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Username
            </span>
            <input
              name="username"
              type="text"
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
              autoComplete="current-password"
              placeholder="Masukkan password admin"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full border border-brand-deep bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(35,73,111,0.18)] transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
          >
            Masuk Admin
          </button>
        </form>

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
