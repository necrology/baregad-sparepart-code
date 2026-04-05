import { CatalogPageClient } from "@/app/(storefront)/katalog/catalog-page-client";
import { getCatalog } from "@/entities/product/api/product-service";
import { defaultCatalogQuery } from "@/entities/product/model/catalog";

export default async function CatalogPage() {
  const catalog = await getCatalog(defaultCatalogQuery);

  return (
    <CatalogPageClient
      products={catalog.items}
      options={catalog.options}
      backendAvailable={catalog.meta.backendAvailable}
    />
  );
}
