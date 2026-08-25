import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

function getSessionStorageKey(slug: string) {
  return `baregad:product-detail-viewed:${slug.trim().toLowerCase()}`;
}

export async function recordProductDetailView(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug || !getPublicBackendBaseUrl() || typeof window === "undefined") {
    return;
  }

  const storageKey = getSessionStorageKey(normalizedSlug);
  try {
    if (window.sessionStorage.getItem(storageKey) === "1") {
      return;
    }
  } catch {
    // Lanjutkan saja jika sessionStorage tidak tersedia.
  }

  try {
    await backendFetchJson(`/catalog/products/${encodeURIComponent(normalizedSlug)}/views`, {
      method: "POST",
      trackActivity: false,
    });
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Abaikan jika browser menolak akses sessionStorage.
    }
  } catch {
    // Abaikan kegagalan pencatatan view agar pengalaman buka detail produk tetap mulus.
  }
}
