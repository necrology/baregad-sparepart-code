"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCatalog } from "@/entities/product/api/product-service";
import {
  buildCatalogPayload,
  defaultCatalogQuery,
} from "@/entities/product/model/catalog";
import type { CatalogPayload, Product } from "@/entities/product/model/types";
import { ProductCard } from "@/entities/product/ui/product-card";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";
import { useBranding } from "@/shared/runtime/app-runtime-provider";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StorefrontSearch } from "@/widgets/storefront/storefront-search";

const initialCatalog = buildCatalogPayload(
  [],
  defaultCatalogQuery,
  "backend",
  !!getPublicBackendBaseUrl(),
);

export default function HomePage() {
  const { branding } = useBranding();
  const [catalog, setCatalog] = useState<CatalogPayload>(initialCatalog);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [popularCatalog, latestCatalog] = await Promise.all([
        getCatalog({ sort: "popular" }),
        getCatalog({ sort: "latest" }),
      ]);

      if (!isMounted) {
        return;
      }

      setCatalog(popularCatalog);
      setFeaturedProducts(popularCatalog.items.slice(0, 6));
      setLatestProducts(latestCatalog.items.slice(0, 4));
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const readyStockCount = catalog.items.filter((product) => product.stock > 0).length;
  const categoryCount = catalog.options.categories.length;

  return (
    <div className="pb-14">
      <section className="pt-6 sm:pt-8">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0 surface-panel noise-overlay rounded-[1.8rem] p-4 sm:p-6">
              <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">
                Toko {branding.brandCategoryLabel}
              </span>
              <h1 className="mt-4 max-w-3xl font-display text-xl font-semibold leading-tight text-ink sm:text-2xl lg:text-3xl">
                {branding.appName} memudahkan kamu mencari sparepart motor dengan
                tampilan yang rapi, harga yang jelas, dan katalog yang enak dijelajahi.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
                Mulai dari kampas rem, oli, busi, CVT, sampai barang yang sering dicari,
                semuanya ditata supaya pencarian terasa cepat, baik di desktop maupun
                handphone.
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
                  <p className="text-xs text-muted">Produk siap jual</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                    {readyStockCount}
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

            <div className="min-w-0 grid gap-3">
              {[
                {
                  title: "Belanja lebih praktis",
                  description:
                    "Cari barang, cek harga, dan bandingkan pilihan dengan tampilan yang tetap nyaman dibaca.",
                },
                {
                  title: "Stok mudah dilihat",
                  description:
                    `${readyStockCount} barang siap dibeli dengan informasi stok dan rating yang langsung terlihat.`,
                },
                {
                  title: "Pengelolaan toko terpisah",
                  description:
                    "Bagian pengelolaan dibuat terpisah supaya area belanja tetap bersih dan nyaman dilihat.",
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
            title="Katalog sparepart yang rapi dan nyaman dipilih"
            description="Tampilan produk dibuat padat, jelas, dan tetap enak dibaca supaya barang yang dicari lebih cepat ketemu."
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
            eyebrow="Produk terbaru"
            title="Pilihan barang terbaru yang baru masuk katalog"
            description="Bagian ini menampilkan barang yang baru ditambahkan atau diperbarui supaya stok baru lebih cepat terlihat."
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {latestProducts.map((product) => (
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
              title="Tata letaknya dibuat supaya barang mudah dicari, dibandingkan, lalu dipilih"
              description="Setiap bagian diarahkan agar informasi penting tampil cepat tanpa membuat layar terasa ramai, terutama saat dibuka lewat mobile."
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {[
                "Filter, pencarian, dan urutan produk membantu kamu menemukan sparepart yang cocok tanpa banyak langkah.",
                "Detail produk menonjolkan harga, stok, rating, dan spesifikasi penting supaya lebih mantap saat memilih.",
                "Bagian pengelolaan toko dipisah agar tampilan belanja tetap bersih dan nyaman.",
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
