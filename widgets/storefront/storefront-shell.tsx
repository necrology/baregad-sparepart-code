"use client";

import { usePathname } from "next/navigation";
import { useBranding } from "@/shared/runtime/app-runtime-provider";
import { Container } from "@/shared/ui/container";
import { Logo } from "@/shared/ui/logo";
import { StorefrontHeader } from "@/widgets/storefront/storefront-header";

type StorefrontShellProps = {
  children: React.ReactNode;
};

export function StorefrontShell({ children }: StorefrontShellProps) {
  const { branding } = useBranding();
  const pathname = usePathname();

  return (
    <div key={pathname} className="min-h-screen overflow-x-hidden">
      <StorefrontHeader key={pathname} branding={branding} />

      <main>{children}</main>

      <footer className="mt-20 border-t border-line bg-canvas-strong/75 py-12">
        <Container className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <Logo compact branding={branding} />
            <p className="max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
              {branding.appTagline} Jelajahi katalog, bandingkan pilihan, dan temukan
              sparepart yang cocok untuk motor harianmu.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Belanja</h3>
            <div className="mt-4 space-y-3 text-sm text-ink-soft">
              <p>Jelajahi katalog sparepart</p>
              <p>Cari barang dengan filter yang mudah dipakai</p>
              <p>Lihat detail, stok, dan kecocokan produk</p>
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Pengelolaan</h3>
            <div className="mt-4 space-y-3 text-sm text-ink-soft">
              <p>Atur barang dan stok toko</p>
              <p>Pantau pesanan yang masuk</p>
              <p>Siapkan restock sebelum stok habis</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
