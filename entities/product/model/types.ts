export type CatalogSort =
  | "popular"
  | "latest"
  | "price-asc"
  | "price-desc"
  | "promo";

export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  image?: string;
  brand: string;
  category: string;
  vehicle: string;
  motorCodes: string[];
  price: number;
  compareAtPrice?: number;
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
  updatedAt: string;
  accentFrom: string;
  accentTo: string;
  accentGlow: string;
};

export type CatalogQuery = {
  q?: string;
  category?: string;
  brand?: string;
  vehicle?: string;
  motorCode?: string;
  availability?: "ready";
  sort: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
};

export type CatalogOptionSet = {
  categories: string[];
  brands: string[];
  vehicles: string[];
  motorCodes: string[];
  priceRange: {
    min: number;
    max: number;
  };
};

export type CatalogPayload = {
  items: Product[];
  total: number;
  options: CatalogOptionSet;
  applied: CatalogQuery;
  meta: {
    source: "mock" | "backend";
    backendAvailable: boolean;
  };
};
