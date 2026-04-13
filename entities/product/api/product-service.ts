import {
  applyCatalogFilters,
  buildCatalogPayload,
  catalogQueryToRecord,
  defaultCatalogQuery,
  sortCatalogProducts,
} from "@/entities/product/model/catalog";
import type {
  CatalogOptionSet,
  CatalogPayload,
  CatalogQuery,
  Product,
} from "@/entities/product/model/types";
import {
  createSparepartCategoryOptions,
  isSparepartCategory,
  normalizeSparepartCategoryQuery,
  resolveSparepartCategory,
} from "@/entities/product/model/sparepart-category";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toFlexibleStringArray(value: unknown) {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  return toStringArray(value);
}

function normalizeProduct(value: unknown): Product | null {
  if (!isRecord(value)) {
    return null;
  }

  const price = Number(value.price);
  const stock = Number(value.stock);
  const rating = Number(value.rating ?? 0);
  const reviewCount = Number(value.reviewCount ?? value.review_count ?? 0);
  const soldCount = Number(value.soldCount ?? value.sold_count ?? 0);

  if (
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string" ||
    typeof value.brand !== "string" ||
    typeof value.category !== "string" ||
    typeof value.vehicle !== "string" ||
    !Number.isFinite(price)
  ) {
    return null;
  }

  const specifications = Array.isArray(value.specifications)
    ? value.specifications
        .filter(isRecord)
        .map((entry) => ({
          label: String(entry.label ?? ""),
          value: String(entry.value ?? ""),
        }))
        .filter((entry) => entry.label && entry.value)
    : [];

  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    sku: String(value.sku ?? value.slug),
    image: typeof value.image === "string" ? value.image : undefined,
    brand: value.brand,
    category: resolveSparepartCategory({
      category: value.category,
      name: value.name,
      slug: value.slug,
      shortDescription: String(value.shortDescription ?? value.short_description ?? ""),
      tags: toStringArray(value.tags),
    }),
    vehicle: value.vehicle,
    motorCodes: toFlexibleStringArray(
      value.motorCodes ?? value.motor_codes ?? value.motorCode ?? value.motor_code,
    ),
    price,
    stock: Number.isFinite(stock) ? stock : 0,
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    shortDescription: String(value.shortDescription ?? value.short_description ?? ""),
    description: String(value.description ?? ""),
    compatibility: toStringArray(value.compatibility),
    specifications,
    tags: toStringArray(value.tags),
    badges: toStringArray(value.badges),
    leadTime: String(value.leadTime ?? value.lead_time ?? "Hubungi admin"),
    location: String(value.location ?? "Gudang pusat"),
    soldCount: Number.isFinite(soldCount) ? soldCount : 0,
    updatedAt: String(value.updatedAt ?? value.updated_at ?? new Date().toISOString()),
    accentFrom: String(value.accentFrom ?? "#f6a25b"),
    accentTo: String(value.accentTo ?? "#c85f34"),
    accentGlow: String(value.accentGlow ?? "rgba(200, 95, 52, 0.24)"),
  };
}

function normalizeCatalogOptions(value: unknown, items: Product[]): CatalogOptionSet {
  const fallback = buildCatalogPayload(items, defaultCatalogQuery, "backend", true).options;

  if (!isRecord(value)) {
    return fallback;
  }

  const priceRange = isRecord(value.priceRange) ? value.priceRange : null;
  const min = Number(priceRange?.min);
  const max = Number(priceRange?.max);
  const brands = [...new Set(toStringArray(value.brands))].sort();
  const vehicles = [...new Set(toStringArray(value.vehicles))].sort();
  const motorCodes = [
    ...new Set(toFlexibleStringArray(value.motorCodes ?? value.motor_codes)),
  ].sort();

  return {
    categories: createSparepartCategoryOptions(),
    brands: brands.length > 0 ? brands : fallback.brands,
    vehicles: vehicles.length > 0 ? vehicles : fallback.vehicles,
    motorCodes: motorCodes.length > 0 ? motorCodes : fallback.motorCodes,
    priceRange: {
      min: Number.isFinite(min) ? min : fallback.priceRange.min,
      max: Number.isFinite(max) ? max : fallback.priceRange.max,
    },
  };
}

function normalizeCatalogPayload(
  value: unknown,
  applied: CatalogQuery,
  backendAvailable: boolean,
): CatalogPayload | null {
  const payload = isRecord(value) ? value : null;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : null;

  if (!rawItems) {
    return null;
  }

  const items = rawItems.map(normalizeProduct).filter((entry): entry is Product => !!entry);
  const total = typeof payload?.total === "number" ? payload.total : items.length;

  return {
    items,
    total,
    options: normalizeCatalogOptions(payload?.options, items),
    applied,
    meta: {
      source: "backend",
      backendAvailable,
    },
  };
}

function createEmptyCatalogPayload(query: CatalogQuery, backendAvailable: boolean) {
  return buildCatalogPayload([], query, "backend", backendAvailable);
}

export async function getCatalog(query: CatalogQuery = defaultCatalogQuery) {
  const normalizedCategory =
    normalizeSparepartCategoryQuery(query.category) ?? query.category;
  const normalizedQuery = {
    ...query,
    category: normalizedCategory,
  } satisfies CatalogQuery;
  const shouldFilterCategoryClientSide = isSparepartCategory(normalizedQuery.category);
  const backendQuery = shouldFilterCategoryClientSide
    ? {
        ...normalizedQuery,
        category: undefined,
      }
    : normalizedQuery;

  if (!getPublicBackendBaseUrl()) {
    return createEmptyCatalogPayload(normalizedQuery, false);
  }

  try {
    const response = await backendFetchJson<unknown>("/catalog/products", {
      query: catalogQueryToRecord(backendQuery),
    });
    const normalized = normalizeCatalogPayload(response, normalizedQuery, true);

    if (normalized) {
      if (!shouldFilterCategoryClientSide) {
        return normalized;
      }

      const filteredItems = sortCatalogProducts(
        applyCatalogFilters(normalized.items, normalizedQuery),
        normalizedQuery.sort,
      );

      return {
        ...normalized,
        items: filteredItems,
        total: filteredItems.length,
        applied: normalizedQuery,
      };
    }
  } catch {
    return createEmptyCatalogPayload(normalizedQuery, true);
  }

  return createEmptyCatalogPayload(normalizedQuery, true);
}

export async function getProductBySlug(slug: string) {
  if (!getPublicBackendBaseUrl()) {
    return {
      item: null,
      source: "backend" as const,
      backendAvailable: false,
    };
  }

  try {
    const response = await backendFetchJson<unknown>(`/catalog/products/${slug}`);
    const normalized = normalizeProduct(
      isRecord(response) && "item" in response ? response.item : response,
    );

    return {
      item: normalized,
      source: "backend" as const,
      backendAvailable: true,
    };
  } catch {
    return {
      item: null,
      source: "backend" as const,
      backendAvailable: true,
    };
  }
}

export async function getAllProductSlugs() {
  const catalog = await getCatalog(defaultCatalogQuery);

  return catalog.items.map((product) => product.slug);
}

export async function getFeaturedProducts(limit = 6) {
  const catalog = await getCatalog({ sort: "popular" });
  return catalog.items.slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const catalog = await getCatalog({ sort: "popular" });

  return catalog.items
    .filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        (candidate.category === product.category || candidate.vehicle === product.vehicle),
    )
    .slice(0, limit);
}
