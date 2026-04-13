import Link from "next/link";
import { buildProductHref } from "@/entities/product/model/product-links";
import type { Product } from "@/entities/product/model/types";
import { ProductPreview } from "@/entities/product/ui/product-preview";
import { formatRupiah } from "@/shared/lib/currency";
import { RatingStars } from "@/shared/ui/rating-stars";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="surface-strong card-hover overflow-hidden rounded-[1.5rem]">
      <div className="p-2">
        <ProductPreview product={product} compact />
      </div>
      <div className="space-y-2.5 px-3 pb-3 pt-0.5 sm:px-4 sm:pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-semibold text-brand-deep">
            {product.category}
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent">
            {product.vehicle}
          </span>
          {product.motorCodes[0] ? (
            <span className="rounded-full border border-line bg-white/75 px-2 py-1 text-[10px] font-semibold text-ink-soft">
              {product.motorCodes[0]}
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-xs">
            {product.brand} | {product.sku}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-[1.15rem] text-ink sm:text-base sm:leading-5">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink-soft sm:text-sm sm:leading-5">
            {product.shortDescription}
          </p>
        </div>

        <div className="space-y-1.5 rounded-[1rem] border border-line bg-canvas-strong/60 p-2.5 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 sm:p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs">
              Harga
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink sm:text-base">
              {formatRupiah(product.price)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs">
              Stok
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink sm:text-base">
              {product.stock > 0 ? `${product.stock} unit` : "Kosong"}
            </p>
            <p className="text-[10px] text-muted sm:text-xs">{product.soldCount} terjual</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <RatingStars
              value={product.rating}
              size="sm"
              valueLabel={product.rating.toFixed(1)}
              metaLabel={`${product.reviewCount} ulasan`}
            />
          </div>
          <Link
            href={buildProductHref(product.slug)}
            className="inline-flex min-w-16 items-center justify-center rounded-full border border-brand-deep bg-brand px-3 py-1.5 text-[11px] leading-none font-semibold whitespace-nowrap text-white shadow-[0_6px_16px_rgba(45,103,156,0.24)] transition hover:bg-brand-deep hover:text-white hover:shadow-[0_8px_20px_rgba(35,73,111,0.28)] focus-visible:text-white sm:min-w-20 sm:px-4 sm:py-2 sm:text-sm"
          >
            Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
