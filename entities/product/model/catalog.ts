import type {
  CatalogOptionSet,
  CatalogPayload,
  CatalogQuery,
  CatalogSort,
  Product,
} from "@/entities/product/model/types";
import {
  createSparepartCategoryOptions,
  normalizeSparepartCategoryQuery,
  resolveSparepartCategory,
} from "@/entities/product/model/sparepart-category";

type SearchParamValue = string | string[] | undefined;

const catalogSortValues: CatalogSort[] = [
  "popular",
  "latest",
  "price-asc",
  "price-desc",
  "promo",
];

export const defaultCatalogQuery: CatalogQuery = {
  sort: "popular",
};

function readFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseCatalogQuery(
  searchParams:
    | URLSearchParams
    | Record<string, SearchParamValue>
    | undefined,
) {
  if (!searchParams) {
    return defaultCatalogQuery;
  }

  const getValue = (key: string) =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key) ?? undefined
      : readFirst(searchParams[key]);

  const sortValue = getValue("sort");
  const categoryValue = getValue("category");
  const normalizedCategory =
    normalizeSparepartCategoryQuery(categoryValue) ?? categoryValue ?? undefined;
  const motorCodeValue = getValue("motorCode")?.trim() || undefined;
  const sort = catalogSortValues.includes(sortValue as CatalogSort)
    ? (sortValue as CatalogSort)
    : defaultCatalogQuery.sort;

  return {
    q: getValue("q")?.trim() || undefined,
    category: normalizedCategory,
    brand: getValue("brand") || undefined,
    vehicle: getValue("vehicle") || undefined,
    motorCode: motorCodeValue,
    availability: getValue("availability") === "ready" ? "ready" : undefined,
    sort,
    minPrice: parseNumber(getValue("minPrice")),
    maxPrice: parseNumber(getValue("maxPrice")),
  } satisfies CatalogQuery;
}

export function createCatalogOptions(products: Product[]): CatalogOptionSet {
  const prices = products.map((product) => product.price);

  return {
    categories: createSparepartCategoryOptions(),
    brands: [...new Set(products.map((product) => product.brand))].sort(),
    vehicles: [...new Set(products.map((product) => product.vehicle))].sort(),
    motorCodes: [...new Set(products.flatMap((product) => product.motorCodes))].sort(),
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
  };
}

export function applyCatalogFilters(products: Product[], query: CatalogQuery) {
  const keyword = query.q?.toLowerCase();

  return products.filter((product) => {
    const productCategory = resolveSparepartCategory(product);

    if (keyword) {
      const haystack = [
        product.name,
        product.brand,
        productCategory,
        product.sku,
        ...product.motorCodes,
        product.shortDescription,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (query.category && productCategory !== query.category) {
      return false;
    }

    if (query.brand && product.brand !== query.brand) {
      return false;
    }

    if (query.vehicle && product.vehicle !== query.vehicle) {
      return false;
    }

    if (query.motorCode && !product.motorCodes.includes(query.motorCode)) {
      return false;
    }

    if (query.availability === "ready" && product.stock < 1) {
      return false;
    }

    if (query.minPrice !== undefined && product.price < query.minPrice) {
      return false;
    }

    if (query.maxPrice !== undefined && product.price > query.maxPrice) {
      return false;
    }

    return true;
  });
}

export function sortCatalogProducts(products: Product[], sort: CatalogSort) {
  const sorted = [...products];

  sorted.sort((left, right) => {
    switch (sort) {
      case "latest":
        return (
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      case "price-asc":
        return left.price - right.price;
      case "price-desc":
        return right.price - left.price;
      case "promo": {
        const leftDiscount = (left.compareAtPrice ?? left.price) - left.price;
        const rightDiscount = (right.compareAtPrice ?? right.price) - right.price;
        return rightDiscount - leftDiscount || right.soldCount - left.soldCount;
      }
      case "popular":
      default:
        return right.soldCount - left.soldCount || right.rating - left.rating;
    }
  });

  return sorted;
}

export function buildCatalogPayload(
  products: Product[],
  query: CatalogQuery,
  source: CatalogPayload["meta"]["source"],
  backendAvailable: boolean,
): CatalogPayload {
  const filtered = applyCatalogFilters(products, query);
  const sorted = sortCatalogProducts(filtered, query.sort);

  return {
    items: sorted,
    total: sorted.length,
    options: createCatalogOptions(products),
    applied: query,
    meta: {
      source,
      backendAvailable,
    },
  };
}

export function catalogQueryToRecord(query: CatalogQuery) {
  return {
    q: query.q,
    category: query.category,
    brand: query.brand,
    vehicle: query.vehicle,
    motorCode: query.motorCode,
    availability: query.availability,
    sort: query.sort,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
  };
}
