"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/entities/product/api/product-service";
import { buildProductHref } from "@/entities/product/model/product-links";
import type { Product } from "@/entities/product/model/types";
import { ProductCard } from "@/entities/product/ui/product-card";
import { ProductPreview } from "@/entities/product/ui/product-preview";
import { ProductWhatsAppPurchase } from "@/entities/product/ui/product-whatsapp-purchase";
import {
  getApprovedProductReviews,
} from "@/entities/product-review/api/product-review-service";
import type { ProductReview } from "@/entities/product-review/model/types";
import { ProductReviewForm } from "@/entities/product-review/ui/product-review-form";
import { getStorefrontWhatsAppAdmins } from "@/entities/user/api/whatsapp-admin-service";
import type { StorefrontWhatsAppAdmin } from "@/entities/user/model/types";
import { useBranding } from "@/shared/runtime/app-runtime-provider";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";
import { buildProductInquiryMessage, buildWhatsAppUrl } from "@/shared/lib/whatsapp";
import { Container } from "@/shared/ui/container";
import { RatingStars } from "@/shared/ui/rating-stars";

type ProductDetailState = {
  product: Product | null;
  relatedProducts: Product[];
  approvedReviews: ProductReview[];
  whatsAppAdmins: StorefrontWhatsAppAdmin[];
  source: "backend";
  backendAvailable: boolean;
  isLoading: boolean;
};

const initialState: ProductDetailState = {
  product: null,
  relatedProducts: [],
  approvedReviews: [],
  whatsAppAdmins: [],
  source: "backend",
  backendAvailable: true,
  isLoading: true,
};

function ProductDetailPageContent() {
  const searchParams = useSearchParams();
  const { branding } = useBranding();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const [state, setState] = useState<ProductDetailState>(initialState);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!slug) {
        if (isMounted) {
          setState({
            ...initialState,
            isLoading: false,
            backendAvailable: true,
          });
        }
        return;
      }

      setState((currentValue) => ({
        ...currentValue,
        isLoading: true,
      }));

      const productResult = await getProductBySlug(slug);

      if (!productResult.item) {
        if (isMounted) {
          setState({
            ...initialState,
            isLoading: false,
            backendAvailable: productResult.backendAvailable,
          });
        }
        return;
      }

      const [relatedProducts, approvedReviews, whatsAppAdmins] = await Promise.all([
        getRelatedProducts(productResult.item, 4),
        getApprovedProductReviews(slug),
        getStorefrontWhatsAppAdmins(),
      ]);

      if (!isMounted) {
        return;
      }

      setState({
        product: productResult.item,
        relatedProducts,
        approvedReviews,
        whatsAppAdmins,
        source: productResult.source,
        backendAvailable: productResult.backendAvailable,
        isLoading: false,
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!state.product) {
      document.title = `${branding.appName} | Detail Produk`;
      return;
    }

    document.title = `${state.product.name} | ${branding.appName}`;
  }, [branding.appName, state.product]);

  if (!slug) {
    return (
      <Container className="py-6">
        <div className="surface-panel rounded-[1.8rem] p-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Produk belum dipilih
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
            Buka detail dari kartu produk di katalog agar halaman ini menampilkan
            barang yang kamu pilih.
          </p>
          <Link
            href="/katalog"
            className="mt-4 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
          >
            Ke Katalog
          </Link>
        </div>
      </Container>
    );
  }

  if (state.isLoading) {
    return (
      <Container className="py-6">
        <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
          Sedang menyiapkan detail produk...
        </div>
      </Container>
    );
  }

  if (!state.product) {
    return (
      <Container className="py-6">
        <div className="surface-panel rounded-[1.8rem] p-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Produk tidak ditemukan
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
            Produk dengan alamat <code>{slug}</code> belum tersedia atau sedang
            belum bisa ditampilkan.
          </p>
          {!state.backendAvailable ? (
            <p className="mt-3 text-sm leading-7 text-ink-soft sm:text-base">
              Detail barang sedang belum bisa ditampilkan. Coba lagi beberapa saat.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/katalog"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Kembali ke Katalog
            </Link>
            <Link
              href={buildProductHref(slug)}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Muat Ulang
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const product = state.product;
  const whatsAppOptions = state.whatsAppAdmins.map((admin) => ({
    id: admin.id,
    label: admin.fullName,
    description: admin.levelName
      ? `${admin.levelName} siap bantu cek stok dan proses pesanan sparepart.`
      : "Admin siap bantu cek stok dan proses pesanan sparepart.",
    href: buildWhatsAppUrl(
      admin.phone,
      buildProductInquiryMessage(
        {
          name: product.name,
          sku: product.sku,
          price: product.price,
        },
        admin.fullName,
        branding.whatsappGreetingLabel,
      ),
    ),
  }));

  return (
    <Container className="py-6">
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <Link href="/" className="hover:text-brand">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/katalog" className="hover:text-brand">
            Katalog
          </Link>
          <span>/</span>
          <span className="font-semibold text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="surface-panel rounded-[1.8rem] p-3 sm:p-4">
            <ProductPreview product={product} />
          </div>

          <div className="space-y-4">
            <div className="surface-panel rounded-[1.8rem] p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand-deep sm:text-xs"
                  >
                    {badge}
                  </span>
                ))}
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent sm:text-xs">
                  {product.vehicle}
                </span>
                {product.motorCodes.map((motorCode) => (
                  <span
                    key={motorCode}
                    className="rounded-full border border-line bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-ink-soft sm:text-xs"
                  >
                    {motorCode}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">
                {product.brand}
              </p>
              <h1 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
                {product.name}
              </h1>
              <div className="mt-3">
                <RatingStars
                  value={product.rating}
                  size="md"
                  valueLabel={product.rating.toFixed(1)}
                  metaLabel={`${product.reviewCount} ulasan`}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
                {product.description}
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <p className="text-xs text-muted">Harga jual</p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                    {formatRupiah(product.price)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Stok</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.stock > 0 ? `${product.stock} unit` : "Pesan dulu"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Estimasi proses</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.leadTime}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Gudang</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.location}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <ProductWhatsAppPurchase
                  options={whatsAppOptions}
                  supportTeamLabel={branding.supportTeamLabel}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="surface-panel rounded-[1.6rem] p-4">
                <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
                  Spesifikasi utama
                </h2>
                <div className="mt-3 space-y-2">
                  {product.specifications.map((specification) => (
                    <div
                      key={specification.label}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-line bg-white/65 px-3 py-2.5"
                    >
                      <span className="text-xs text-ink-soft sm:text-sm">{specification.label}</span>
                      <span className="text-xs font-semibold text-ink sm:text-sm">
                        {specification.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-panel rounded-[1.6rem] p-4">
                <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
                  Kompatibilitas
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.compatibility.map((compatibility) => (
                    <span
                      key={compatibility}
                      className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs text-ink-soft sm:text-sm"
                    >
                      {compatibility}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-sm font-semibold text-ink">Info produk</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    Informasi barang ini terakhir diperbarui pada{" "}
                    {formatDate(product.updatedAt)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="surface-panel rounded-[1.8rem] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Kirim ulasan
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
                  Bagikan pengalaman pakai produk
                </h2>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                Dicek dulu
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
              Ulasan baru akan dicek lebih dulu agar komentar yang tampil tetap rapi
              dan membantu pembeli lain.
            </p>

            <ProductReviewForm slug={slug} />
          </div>

          <div className="space-y-4">
            <div className="surface-panel rounded-[1.8rem] p-4 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Ringkasan ulasan
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Rating rata-rata</p>
                  <div className="mt-2">
                    <RatingStars
                      value={product.rating}
                      size="md"
                      valueLabel={`${product.rating.toFixed(1)}/5`}
                    />
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Ulasan tayang</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.reviewCount} ulasan
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Status moderasi</p>
                  <p className="mt-1 text-lg font-semibold text-ink">Dicek manual</p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[1.8rem] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                    Komentar pelanggan
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft sm:text-base">
                    Ulasan yang sudah lolos pengecekan akan tampil di halaman produk.
                  </p>
                </div>
                <span className="rounded-full border border-line bg-white/75 px-3 py-1 text-xs font-semibold text-ink-soft">
                  {state.approvedReviews.length} tampil
                </span>
              </div>

              {state.approvedReviews.length === 0 ? (
                <div className="mt-4 rounded-[1.2rem] border border-line bg-white/70 p-4 text-sm leading-6 text-ink-soft">
                  Belum ada ulasan yang tampil untuk produk ini. Kamu bisa jadi orang pertama
                  yang membagikan pengalaman penggunaan.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {state.approvedReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[1.2rem] border border-line bg-white/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{review.customerName}</p>
                          <p className="mt-1 text-xs text-ink-soft">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <RatingStars
                          value={review.rating}
                          size="sm"
                          valueLabel={`${review.rating}/5`}
                        />
                      </div>
                      <p className="mt-3 text-sm leading-7 text-ink-soft sm:text-base">
                        {review.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
              Produk terkait
            </h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">
              Pilihan lain yang mungkin juga cocok untuk motor yang sama.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {state.relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailPageContent />
    </Suspense>
  );
}
