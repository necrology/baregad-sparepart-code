import "server-only";
import type { ProductReview } from "@/entities/product-review/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getAdminProductReviews() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return [] as ProductReview[];
  }

  try {
    return await backendFetchJson<ProductReview[]>("/admin/product-reviews", {
      headers,
    });
  } catch {
    return [] as ProductReview[];
  }
}
