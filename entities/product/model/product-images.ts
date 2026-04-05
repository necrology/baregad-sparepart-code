import type { Product } from "@/entities/product/model/types";

export const DEFAULT_PRODUCT_IMAGE =
  "/images/products/default-sparepart.jpg";

export function getProductImageSrc(product: Pick<Product, "category" | "image">) {
  return product.image ?? DEFAULT_PRODUCT_IMAGE;
}
