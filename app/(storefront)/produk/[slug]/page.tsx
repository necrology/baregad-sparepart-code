import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/entities/product/api/product-service";
import { getApprovedProductReviews } from "@/entities/product-review/api/product-review-service";
import { getStorefrontWhatsAppAdmins } from "@/entities/user/api/whatsapp-admin-service";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { ProductCard } from "@/entities/product/ui/product-card";
import { ProductWhatsAppPurchase } from "@/entities/product/ui/product-whatsapp-purchase";
import { ProductPreview } from "@/entities/product/ui/product-preview";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";
import { buildProductInquiryMessage, buildWhatsAppUrl } from "@/shared/lib/whatsapp";
import { Container } from "@/shared/ui/container";
import { RatingInput } from "@/shared/ui/rating-input";
import { RatingStars } from "@/shared/ui/rating-stars";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product.item) {
    return {
      title: "Produk tidak ditemukan",
    };
  }

  return {
    title: product.item.name,
    description: product.item.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);

  if (!productResult.item) {
    notFound();
  }
  const product = productResult.item;

  const [branding, relatedProducts, approvedReviews, whatsAppAdmins] = await Promise.all([
    getPublicAppConfig(),
    getRelatedProducts(product, 4),
    getApprovedProductReviews(slug),
    getStorefrontWhatsAppAdmins(),
  ]);
  const whatsAppOptions = whatsAppAdmins.map((admin) => ({
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
                {product.compareAtPrice ? (
                  <div>
                    <p className="text-xs text-muted">Harga normal</p>
                    <p className="mt-1 text-sm text-muted line-through sm:text-base">
                      {formatRupiah(product.compareAtPrice)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Stok</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.stock > 0
                      ? `${product.stock} unit`
                      : "Backorder"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Lead time</p>
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
                  <p className="text-sm font-semibold text-ink">Catatan data</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    Halaman ini mengambil detail dari source{" "}
                    <span className="font-semibold text-ink">{productResult.source}</span>.
                    Terakhir diperbarui pada {formatDate(product.updatedAt)}.
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
                  Kirim review
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
                  Bagikan pengalaman pakai produk
                </h2>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                Moderasi aktif
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
              Review baru akan dicek admin lebih dulu untuk menjaga kualitas komentar yang
              tampil di storefront.
            </p>

            <form
              action="/api/product-reviews/create"
              method="post"
              className="mt-5 grid gap-3"
            >
              <input type="hidden" name="slug" value={slug} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Nama
                </span>
                <input
                  name="customerName"
                  required
                  placeholder="Contoh: Dimas Pratama"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Email
                </span>
                <input
                  name="customerEmail"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Rating
                </span>
                <RatingInput name="rating" defaultValue={5} />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Komentar
                </span>
                <textarea
                  name="comment"
                  required
                  rows={5}
                  minLength={12}
                  placeholder="Ceritakan pengalaman penggunaan, kualitas barang, atau proses pengirimannya."
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
              >
                Kirim Review
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="surface-panel rounded-[1.8rem] p-4 sm:p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Ringkasan review
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
                  <p className="text-xs text-muted">Review tayang</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {product.reviewCount} ulasan
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white/70 p-3">
                  <p className="text-xs text-muted">Status moderasi</p>
                  <p className="mt-1 text-lg font-semibold text-ink">Manual admin</p>
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
                    Hanya review yang sudah disetujui admin yang akan tampil di halaman produk.
                  </p>
                </div>
                <span className="rounded-full border border-line bg-white/75 px-3 py-1 text-xs font-semibold text-ink-soft">
                  {approvedReviews.length} tampil
                </span>
              </div>

              {approvedReviews.length === 0 ? (
                <div className="mt-4 rounded-[1.2rem] border border-line bg-white/70 p-4 text-sm leading-6 text-ink-soft">
                  Belum ada review yang tampil untuk produk ini. Kamu bisa jadi orang pertama
                  yang membagikan pengalaman penggunaan.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {approvedReviews.map((review) => (
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
              Kandidat upsell atau cross-sell yang bisa diisi otomatis dari backend nanti.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
