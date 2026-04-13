import type { ProductSpecification } from "@/entities/product/model/types";

type ProductPayload = {
  name: string;
  slug: string;
  sku: string;
  image: string;
  brand: string;
  category: string;
  vehicle: string;
  motorCodes: string[];
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  compatibility: string[];
  specifications: ProductSpecification[];
  tags: string[];
  badges: string[];
  leadTime: string;
  location: string;
  soldCount: number;
  accentFrom: string;
  accentTo: string;
  accentGlow: string;
};

export const defaultProductAccent = {
  from: "#f6a25b",
  to: "#c85f34",
  glow: "rgba(200, 95, 52, 0.24)",
} as const;

export function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugifyValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveProductSlug(formData: FormData) {
  const manualSlug = slugifyValue(readFormValue(formData, "slug"));

  if (manualSlug) {
    return manualSlug;
  }

  const existingSlug = slugifyValue(readFormValue(formData, "existingSlug"));

  if (existingSlug) {
    return existingSlug;
  }

  return slugifyValue(readFormValue(formData, "name"));
}

export function parseNumberValue(formData: FormData, key: string, fallback = 0) {
  const rawValue = readFormValue(formData, key);
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseListValue(formData: FormData, key: string) {
  return Array.from(
    new Set(
      readFormValue(formData, key)
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function parseSpecificationsValue(formData: FormData, key: string) {
  return readFormValue(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return {
          label: line,
          value: "",
        };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((item) => item.label && item.value);
}

export function buildProductPayload(formData: FormData): ProductPayload {
  return {
    name: readFormValue(formData, "name"),
    slug: resolveProductSlug(formData),
    sku: readFormValue(formData, "sku"),
    image: readFormValue(formData, "image"),
    brand: readFormValue(formData, "brand"),
    category: readFormValue(formData, "category"),
    vehicle: readFormValue(formData, "vehicle"),
    motorCodes: parseListValue(formData, "motorCodes"),
    price: parseNumberValue(formData, "price"),
    stock: parseNumberValue(formData, "stock"),
    rating: parseNumberValue(formData, "rating"),
    reviewCount: parseNumberValue(formData, "reviewCount"),
    shortDescription: readFormValue(formData, "shortDescription"),
    description: readFormValue(formData, "description"),
    compatibility: parseListValue(formData, "compatibility"),
    specifications: parseSpecificationsValue(formData, "specifications"),
    tags: parseListValue(formData, "tags"),
    badges: parseListValue(formData, "badges"),
    leadTime: readFormValue(formData, "leadTime") || "Hubungi admin",
    location: readFormValue(formData, "location") || "Gudang pusat",
    soldCount: parseNumberValue(formData, "soldCount"),
    accentFrom: readFormValue(formData, "accentFrom") || defaultProductAccent.from,
    accentTo: readFormValue(formData, "accentTo") || defaultProductAccent.to,
    accentGlow: readFormValue(formData, "accentGlow") || defaultProductAccent.glow,
  };
}
