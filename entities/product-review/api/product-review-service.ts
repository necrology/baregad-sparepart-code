import type { ProductReview } from "@/entities/product-review/model/types";
import { appFetchJson } from "@/shared/api/app-client";

export async function getApprovedProductReviews(slug: string) {
  if (!slug.trim()) {
    return [] as ProductReview[];
  }

  try {
    return await appFetchJson<ProductReview[]>(
      `/review-api/product-reviews/${encodeURIComponent(slug)}`,
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
    imageFile?: File | null;
  },
) {
  const formData = new FormData();

  formData.set("customerName", payload.customerName);
  formData.set("customerEmail", payload.customerEmail);
  formData.set("rating", String(payload.rating));
  formData.set("comment", payload.comment);

  if (payload.imageFile instanceof File && payload.imageFile.size > 0) {
    formData.set("image", payload.imageFile);
  }

  return appFetchJson<ProductReview>(
    `/review-api/product-reviews/${encodeURIComponent(slug)}`,
    {
    method: "POST",
    formData,
    },
  );
}
