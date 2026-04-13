import { Suspense } from "react";
import { CatalogPageClient } from "@/app/(storefront)/katalog/catalog-page-client";

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogPageClient />
    </Suspense>
  );
}
