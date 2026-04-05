"use client";

import { useSearchParams } from "next/navigation";
import {
  buildCatalogPayload,
  parseCatalogQuery,
} from "@/entities/product/model/catalog";
import type { CatalogOptionSet, Product } from "@/entities/product/model/types";
import { ProductCard } from "@/entities/product/ui/product-card";
import { CatalogFilters } from "@/features/catalog/ui/catalog-filters";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

type CatalogPageClientProps = {
  products: Product[];
  options: CatalogOptionSet;
  backendAvailable: boolean;
};

function buildActiveFilters(query: ReturnType<typeof parseCatalogQuery>) {
  return [
    query.q ? `Keyword: ${query.q}` : null,
    query.category ? `Kategori: ${query.category}` : null,
    query.brand ? `Brand: ${query.brand}` : null,
    query.vehicle ? `Motor: ${query.vehicle}` : null,
    query.motorCode ? `Kode motor: ${query.motorCode}` : null,
    query.availability ? "Stok siap" : null,
    query.sort !== "popular" ? `Sort: ${query.sort}` : null,
  ].filter(Boolean) as string[];
}

export function CatalogPageClient({
  products,
  options,
  backendAvailable,
}: CatalogPageClientProps) {
  const searchParams = useSearchParams();
  const query = parseCatalogQuery(new URLSearchParams(searchParams.toString()));
  const catalog = buildCatalogPayload(products, query, "backend", backendAvailable);
  const activeFilters = buildActiveFilters(query);

  return (
    <Container className="py-6">
      <div className="space-y-4">
        <div className="surface-panel rounded-[1.8rem] p-4 sm:p-6">
          <SectionHeading
            eyebrow="Katalog"
            title="List produk, filter, dan search sudah disiapkan untuk pola e-commerce sparepart"
            description="Pilih kategori, brand, tipe motor, kode motor, atau harga agar customer bisa langsung mengerucut ke sparepart yang paling cocok."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-deep">
              {catalog.total} produk tampil
            </span>
            {activeFilters.length > 0 ? (
              <span className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-soft">
                {activeFilters.length} filter aktif
              </span>
            ) : null}
          </div>
          {activeFilters.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs text-ink-soft"
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <CatalogFilters
              key={JSON.stringify(catalog.applied)}
              options={options}
              applied={catalog.applied}
              total={catalog.total}
            />
          </aside>

          <div className="space-y-5">
            {catalog.items.length === 0 ? (
              <div className="surface-panel rounded-[2rem] p-8">
                <h2 className="font-display text-2xl font-semibold text-ink">
                  Belum ada produk yang sesuai filter.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
                  Ubah keyword pencarian, pilih kategori yang lebih luas, atau reset
                  filter untuk melihat lebih banyak sparepart.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {catalog.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
