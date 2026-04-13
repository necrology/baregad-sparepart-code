import { buildSearchParams } from "@/shared/lib/query";

export function buildProductHref(slug: string) {
  const params = buildSearchParams({
    slug: slug.trim() || undefined,
  });
  const queryString = params.toString();

  return queryString ? `/produk?${queryString}` : "/produk";
}
