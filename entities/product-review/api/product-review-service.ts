import "server-only";
import type { ProductReview } from "@/entities/product-review/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getApprovedProductReviews(slug: string) {
  const config = getBackendRuntimeConfig();

  if (!config.enabled || !slug.trim()) {
    return [] as ProductReview[];
  }

  try {
    return await backendFetchJson<ProductReview[]>(
      `/catalog/products/${encodeURIComponent(slug)}/reviews`,
    );
  } catch {
    return [] as ProductReview[];
  }
}
