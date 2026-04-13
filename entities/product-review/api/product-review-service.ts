import type { ProductReview } from "@/entities/product-review/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getApprovedProductReviews(slug: string) {
  if (!getPublicBackendBaseUrl() || !slug.trim()) {
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

export async function submitProductReview(
  slug: string,
  payload: {
    customerName: string;
    customerEmail: string;
    rating: number;
    comment: string;
  },
) {
  return backendFetchJson<ProductReview>(
    `/catalog/products/${encodeURIComponent(slug)}/reviews`,
    {
      method: "POST",
      json: payload,
    },
  );
}
