import Link from "next/link";
import { getCatalog, getFeaturedProducts, getPromoProducts } from "@/entities/product/api/product-service";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { ProductCard } from "@/entities/product/ui/product-card";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StorefrontSearch } from "@/widgets/storefront/storefront-search";

export default async function HomePage() {
  const [catalog, featuredProducts, promoProducts, branding] = await Promise.all([
    getCatalog({ sort: "popular" }),
    getFeaturedProducts(6),
    getPromoProducts(4),
    getPublicAppConfig(),
  ]);
  const readyStockCount = catalog.items.filter((product) => product.stock > 0).length;
  const promoCount = catalog.items.filter((product) => product.compareAtPrice).length;
  const categoryCount = catalog.options.categories.length;

  return (
    <div className="pb-14">
      <section className="pt-6 sm:pt-8">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="surface-panel noise-overlay rounded-[1.8rem] p-4 sm:p-6">
              <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
                E-commerce {branding.brandCategoryLabel}
              </span>
              <h1 className="mt-4 max-w-3xl font-display text-xl font-semibold leading-tight text-ink sm:text-2xl lg:text-3xl">
                {branding.appName} membantu customer menemukan sparepart motor dengan tampilan
                yang rapi, harga jelas, dan katalog yang nyaman dijelajahi.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
                Mulai dari kampas rem, oli, busi, CVT, sampai part fast moving lain,
                semua ditata agar pencarian produk terasa cepat baik di desktop maupun
                mobile.
              </p>
              <div className="mt-5 space-y-3">
                <StorefrontSearch
                  variant="hero"
                  placeholder="Cari semua barang: kampas rem, oli, busi, Honda KPH"
                  helperText="Bisa cari berdasarkan nama produk, SKU, brand, kategori, atau kode motor."
                />
                <div className="flex">
                  <Link
                    href="/katalog"
                    className="rounded-full bg-brand px-3.5 py-2 text-center text-[11px] font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white sm:text-sm"
                  >
                    Jelajahi Katalog
                  </Link>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Total produk aktif</p>
                  <p className="mt-1.5 font-display text-xl font-semibold text-ink">
                    {catalog.total}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Promo berjalan</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                    {promoCount}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Kategori pilihan</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                    {categoryCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                {
                  title: "Belanja lebih cepat",
                  description:
                    "Cari produk, cek harga, dan bandingkan opsi dengan layout yang tetap nyaman dibaca.",
                },
                {
                  title: "Stok siap dipantau",
                  description:
                    `${readyStockCount} produk siap dibeli dengan informasi stok dan rating yang langsung terlihat.`,
                },
                {
                  title: "Admin terpisah rapi",
                  description:
                    "Akses pengelolaan toko dibuka lewat login admin tersendiri agar area customer tetap bersih.",
                },
              ].map((item) => (
                <div key={item.title} className="surface-panel rounded-[1.5rem] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Highlight
                  </p>
                  <h2 className="mt-2 font-display text-lg font-semibold text-ink">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="mt-10">
        <Container>
          <SectionHeading
            eyebrow="Produk unggulan"
            title="Katalog sparepart yang langsung terasa seperti aplikasi jualan sungguhan"
            description="Grid produk dibuat padat, rapi, dan tetap informatif supaya customer bisa fokus memilih barang dengan cepat."
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="mt-10">
        <Container>
          <SectionHeading
            eyebrow="Promo cepat"
            title="Slot promo yang bisa diisi campaign, flash sale, atau clearance stock"
            description="Bagian promo disiapkan untuk menonjolkan barang diskon, paket bundling, atau stok yang perlu dipercepat penjualannya."
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="mt-10">
        <Container>
          <div className="surface-panel rounded-[1.8rem] p-4 sm:p-6">
            <SectionHeading
              eyebrow="Pengalaman belanja"
              title="Tata letak dibuat supaya customer mudah mencari, membandingkan, dan membeli"
              description="Setiap bagian diarahkan agar informasi penting tampil cepat tanpa membuat layar terasa ramai, terutama saat dibuka lewat mobile."
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {[
                "Filter, search, dan sorting membantu customer menemukan part yang relevan tanpa banyak langkah.",
                "Detail produk menonjolkan harga, stok, rating, dan spesifikasi inti agar keputusan beli terasa lebih yakin.",
                "Area admin tetap terpisah supaya pengelolaan katalog dan pesanan tidak mengganggu tampilan storefront.",
              ].map((point) => (
                <div key={point} className="rounded-[1.25rem] border border-line bg-white/65 p-4">
                  <p className="text-sm leading-6 text-ink-soft">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
