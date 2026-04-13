import type { ProductReview } from "@/entities/product-review/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getAdminProductReviews(token: string | null | undefined) {
  if (!getPublicBackendBaseUrl() || !token?.trim()) {
    return [] as ProductReview[];
  }

  try {
    return await backendFetchJson<ProductReview[]>("/admin/product-reviews", {
      token,
    });
  } catch {
    return [] as ProductReview[];
  }
}
