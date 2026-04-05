import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { getProductImageSrc } from "@/entities/product/model/product-images";
import type { Product } from "@/entities/product/model/types";

type ProductPreviewProps = {
  product: Product;
  className?: string;
  compact?: boolean;
};

export function ProductPreview({
  product,
  className,
  compact = false,
}: ProductPreviewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-white/40 bg-white",
        compact ? "h-32 sm:h-36" : "h-64 sm:h-72",
        className,
      )}
      style={{
        boxShadow: "0 16px 32px rgba(35, 73, 111, 0.12)",
      }}
    >
      <Image
        src={getProductImageSrc(product)}
        alt={product.name}
        fill
        sizes={
          compact
            ? "(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 24vw"
            : "(max-width: 1024px) 100vw, 50vw"
        }
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(32,55,82,0.08))]" />
    </div>
  );
}
