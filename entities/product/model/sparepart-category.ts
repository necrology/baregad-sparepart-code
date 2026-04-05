import type { Product } from "@/entities/product/model/types";

export const sparepartCategoryOptions = [
  "Mesin",
  "Suspensi",
  "Pengereman",
  "Oli",
  "Ban",
  "Aksesoris",
] as const;

export type SparepartCategory = (typeof sparepartCategoryOptions)[number];

type ProductCategorySource = Pick<
  Product,
  "category" | "name" | "slug" | "tags" | "shortDescription"
>;

const directCategoryMap: Record<string, SparepartCategory> = {
  mesin: "Mesin",
  engine: "Mesin",
  pengapian: "Mesin",
  cvt: "Mesin",
  filter: "Mesin",
  rantai: "Mesin",
  suspensi: "Suspensi",
  pengereman: "Pengereman",
  rem: "Pengereman",
  oli: "Oli",
  pelumas: "Oli",
  ban: "Ban",
  tire: "Ban",
  aksesoris: "Aksesoris",
  accessory: "Aksesoris",
  accessories: "Aksesoris",
};

const categoryMatchers: Array<{ category: SparepartCategory; pattern: RegExp }> = [
  { category: "Ban", pattern: /\bban\b|\btire\b/i },
  { category: "Suspensi", pattern: /\bshock\b|\bshockbreaker\b|\bsuspensi\b|\bfork\b/i },
  { category: "Pengereman", pattern: /\brem\b|\bbrake\b/i },
  { category: "Oli", pattern: /\boli\b|\bpelumas\b|\blubricant\b/i },
  {
    category: "Aksesoris",
    pattern: /\blampu\b|\bled\b|\baksesoris\b|\bvisor\b|\bbox\b|\bholder\b|\bcover\b|\bstiker\b/i,
  },
  {
    category: "Mesin",
    pattern:
      /\baki\b|\bbattery\b|\bbusi\b|\bfilter\b|\bcvt\b|\bv-belt\b|\brantai\b|\bchain\b|\bkopling\b|\bstarter\b|\binjeksi\b|\bmesin\b/i,
  },
];

function normalizeCategoryKey(value: string | undefined | null) {
  return value?.trim().toLowerCase();
}

function createCategoryHaystack(product: ProductCategorySource) {
  return [
    product.category,
    product.name,
    product.slug,
    product.shortDescription,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isSparepartCategory(
  value: string | undefined | null,
): value is SparepartCategory {
  return sparepartCategoryOptions.includes(value as SparepartCategory);
}

export function normalizeSparepartCategoryQuery(value: string | undefined | null) {
  if (!value) {
    return undefined;
  }

  if (isSparepartCategory(value)) {
    return value;
  }

  const normalizedKey = normalizeCategoryKey(value);

  if (!normalizedKey || normalizedKey === "kelistrikan") {
    return undefined;
  }

  return directCategoryMap[normalizedKey];
}

export function resolveSparepartCategory(product: ProductCategorySource): SparepartCategory {
  const directMatch = normalizeSparepartCategoryQuery(product.category);

  if (directMatch) {
    return directMatch;
  }

  const haystack = createCategoryHaystack(product);
  const matchedCategory = categoryMatchers.find(({ pattern }) => pattern.test(haystack));

  return matchedCategory?.category ?? "Mesin";
}

export function createSparepartCategoryOptions() {
  return [...sparepartCategoryOptions];
}

export function createSparepartCategoryShare(products: ProductCategorySource[]) {
  return sparepartCategoryOptions
    .map((label) => ({
      label,
      total: products.filter((product) => resolveSparepartCategory(product) === label).length,
    }))
    .filter((item) => item.total > 0);
}
