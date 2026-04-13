import type { Product } from "@/entities/product/model/types";
import { withBasePath } from "@/shared/config/base-path";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export const DEFAULT_PRODUCT_IMAGE =
  withBasePath("/images/products/default-sparepart.jpg");

function resolveBackendAssetPath(value: string) {
  if (!value.startsWith("/api/") && !value.startsWith("/uploads/")) {
    return value;
  }

  const backendBaseUrl = getPublicBackendBaseUrl();

  if (!backendBaseUrl) {
    return value;
  }

  try {
    return new URL(value, `${new URL(backendBaseUrl).origin}/`).toString();
  } catch {
    return value;
  }
}

export function getProductImageSrc(product: Pick<Product, "category" | "image">) {
  const image = product.image?.trim();

  if (!image) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  return withBasePath(resolveBackendAssetPath(image));
}
