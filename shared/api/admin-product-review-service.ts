import type { ProductReview } from "@/entities/product-review/model/types";
import { appFetchJson } from "@/shared/api/app-client";

export async function getAdminProductReviews(token: string | null | undefined) {
  if (!token?.trim()) {
    return [] as ProductReview[];
  }

  try {
    return await appFetchJson<ProductReview[]>("/review-api/admin/product-reviews", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return [] as ProductReview[];
  }
}
