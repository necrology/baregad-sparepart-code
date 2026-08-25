"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCatalog } from "@/entities/product/api/product-service";
import { createSparepartCategoryShare } from "@/entities/product/model/sparepart-category";
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

const homePageSize = 12;

type HomeQuickFilter = "all" | "ready" | "category";

function buildPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

export default function HomePage() {
  const { branding } = useBranding();
  const [catalog, setCatalog] = useState<CatalogPayload>(initialCatalog);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<HomeQuickFilter>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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
      setLatestProducts(latestCatalog.items.slice(0, 4));
      setActiveCategory((currentCategory) => {
        if (
          currentCategory &&
          popularCatalog.options.categories.includes(currentCategory)
        ) {
          return currentCategory;
        }

        return popularCatalog.options.categories[0] ?? null;
      });
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const readyStockCount = catalog.items.filter((product) => product.stock > 0).length;
  const categoryCount = catalog.options.categories.length;
  const categoryShare = createSparepartCategoryShare(catalog.items);
  const selectedCategory =
    activeQuickFilter === "category"
      ? activeCategory ?? catalog.options.categories[0] ?? null
      : null;
  const filteredProducts = catalog.items.filter((product) => {
    if (activeQuickFilter === "ready" && product.stock < 1) {
      return false;
    }

    if (activeQuickFilter === "category" && selectedCategory) {
      return product.category === selectedCategory;
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / homePageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = filteredProducts.length === 0 ? 0 : (currentPage - 1) * homePageSize + 1;
  const endIndex = Math.min(currentPage * homePageSize, filteredProducts.length);
  const visibleProducts = filteredProducts.slice(startIndex > 0 ? startIndex - 1 : 0, endIndex);
  const visiblePages = buildPageNumbers(currentPage, totalPages);
  const activeFilterLabel =
    activeQuickFilter === "ready"
      ? "Produk siap jual"
      : activeQuickFilter === "category" && selectedCategory
        ? `Kategori ${selectedCategory}`
        : "Semua produk aktif";

  function handleQuickFilterChange(nextFilter: HomeQuickFilter) {
    setActiveQuickFilter(nextFilter);
    setPage(1);

    if (nextFilter !== "category") {
      setActiveCategory(null);
      return;
    }

    setActiveCategory((currentCategory) => {
      if (currentCategory && catalog.options.categories.includes(currentCategory)) {
        return currentCategory;
      }

      return catalog.options.categories[0] ?? null;
    });
  }

  function handleCategoryChange(category: string) {
    setActiveQuickFilter("category");
    setActiveCategory(category);
    setPage(1);
  }

  return (
    <div className="pb-14">
      <section className="pt-6 sm:pt-8">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0 rounded-[1.8rem] border border-line bg-white/55 p-4 sm:p-6">
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
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("all")}
                  className={`rounded-[1.2rem] border p-3 text-left transition hover:-translate-y-0.5 ${
                    activeQuickFilter === "all"
                      ? "border-brand bg-brand-soft/60 shadow-[0_14px_32px_rgba(210,129,54,0.14)]"
                      : "border-line bg-white/70 hover:border-brand/30"
                  }`}
                >
                  <p className="text-xs text-muted">Total produk aktif</p>
                  <p className="mt-1.5 font-display text-xl font-semibold text-ink">
                    {catalog.total}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">
                    Tampilkan semua barang yang aktif di katalog.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("ready")}
                  className={`rounded-[1.2rem] border p-3 text-left transition hover:-translate-y-0.5 ${
                    activeQuickFilter === "ready"
                      ? "border-brand bg-brand-soft/60 shadow-[0_14px_32px_rgba(210,129,54,0.14)]"
                      : "border-line bg-white/70 hover:border-brand/30"
                  }`}
                >
                  <p className="text-xs text-muted">Produk siap jual</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                    {readyStockCount}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">
                    Fokus ke barang yang stoknya sudah tersedia.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("category")}
                  className={`rounded-[1.2rem] border p-3 text-left transition hover:-translate-y-0.5 ${
                    activeQuickFilter === "category"
                      ? "border-brand bg-brand-soft/60 shadow-[0_14px_32px_rgba(210,129,54,0.14)]"
                      : "border-line bg-white/70 hover:border-brand/30"
                  }`}
                >
                  <p className="text-xs text-muted">Kategori pilihan</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                    {categoryCount}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">
                    Klik lalu pilih kategori yang ingin ditampilkan di beranda.
                  </p>
                </button>
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
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-line bg-white/60 p-4"
                >
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
            eyebrow="Belanja dari beranda"
            title="Semua produk bisa dijelajahi langsung tanpa pindah ke katalog"
            description="Klik kartu ringkasan untuk menyaring daftar produk, lalu pindah halaman jika ingin melihat barang berikutnya."
          />
          <div className="mt-6 sm:rounded-[1.8rem] sm:border sm:border-line sm:bg-white/45 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-deep">
                  Filter aktif: {activeFilterLabel}
                </span>
                <span className="rounded-full border border-line bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-soft">
                  {filteredProducts.length} produk tampil
                </span>
              </div>
              <p className="text-xs leading-5 text-muted">
                Menampilkan {startIndex}-{endIndex} dari {filteredProducts.length} produk
              </p>
            </div>

            {activeQuickFilter === "category" && categoryShare.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryShare.map((category) => {
                  const isActive = selectedCategory === category.label;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => handleCategoryChange(category.label)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        isActive
                          ? "border-brand bg-brand text-white shadow-[0_14px_30px_rgba(184,92,44,0.2)]"
                          : "border-line bg-white/82 text-ink-soft hover:border-brand/40 hover:text-ink"
                      }`}
                    >
                      {category.label} ({category.total})
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              {visibleProducts.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-line bg-white/70 p-6">
                  <h3 className="font-display text-xl font-semibold text-ink">
                    Belum ada produk untuk filter ini.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                    Coba pindah ke filter lain atau pilih kategori yang berbeda supaya lebih
                    banyak barang tampil di beranda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {filteredProducts.length > homePageSize ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-line bg-white/72 p-3">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Sebelumnya
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {visiblePages.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        aria-current={pageNumber === currentPage ? "page" : undefined}
                        className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
                          pageNumber === currentPage
                            ? "bg-brand text-white shadow-[0_12px_28px_rgba(184,92,44,0.24)]"
                            : "border border-line bg-white/85 text-ink-soft hover:border-brand/40 hover:text-ink"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Berikutnya
                  </button>
                </div>
              ) : null}
            </div>
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
          <div className="rounded-[1.8rem] border border-line bg-white/45 p-4 sm:p-6">
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
