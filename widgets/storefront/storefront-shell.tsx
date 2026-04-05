import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { Container } from "@/shared/ui/container";
import { Logo } from "@/shared/ui/logo";
import { StorefrontHeader } from "@/widgets/storefront/storefront-header";

type StorefrontShellProps = {
  children: React.ReactNode;
};

export async function StorefrontShell({ children }: StorefrontShellProps) {
  const branding = await getPublicAppConfig();

  return (
    <div className="min-h-screen">
      <StorefrontHeader branding={branding} />

      <main>{children}</main>

      <footer className="mt-20 border-t border-line bg-canvas-strong/75 py-12">
        <Container className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <Logo compact branding={branding} />
            <p className="max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
              {branding.appTagline} Jelajahi katalog, bandingkan harga, dan temukan sparepart
              yang paling sesuai untuk kebutuhan motor customer.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Customer</h3>
            <div className="mt-4 space-y-3 text-sm text-ink-soft">
              <p>Beranda promosi sparepart</p>
              <p>Katalog dengan filter dan pencarian</p>
              <p>Detail produk, harga, stok, dan kompatibilitas</p>
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Admin</h3>
            <div className="mt-4 space-y-3 text-sm text-ink-soft">
              <p>Dashboard performa operasional</p>
              <p>Manajemen produk dan stok</p>
              <p>Monitoring pesanan dan kesiapan restock</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
