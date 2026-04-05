import Link from "next/link";
import { getCatalog } from "@/entities/product/api/product-service";
import { sortCatalogProducts } from "@/entities/product/model/catalog";
import { createSparepartCategoryOptions } from "@/entities/product/model/sparepart-category";
import type {
  CatalogSort,
  Product,
  ProductSpecification,
} from "@/entities/product/model/types";
import { ProductPreview } from "@/entities/product/ui/product-preview";
import {
  adminPageSizeOptions,
  buildAdminPageHref,
  matchesDateRange,
  matchesTextQuery,
  paginateItems,
  readNumberSearchParam,
  readSearchParam,
  type SearchParamsRecord,
} from "@/shared/lib/admin-list";
import { cn } from "@/shared/lib/cn";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";
import { requireAdminPageAccess } from "@/shared/auth/admin-page-access";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";
import { AdminModal } from "@/shared/ui/admin-modal";
import { AdminIconButton, AdminIconLink } from "@/shared/ui/admin-icon-action";
import { EditIcon, TrashIcon } from "@/shared/ui/app-icons";

type AdminProductsPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

type ProductFormFieldsProps = {
  product?: Product | null;
  brandOptions: string[];
  vehicleOptions: string[];
  categoryOptions: string[];
  datalistPrefix: string;
};

const adminProductSortOptions = [
  "latest",
  "popular",
  "promo",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
] as const;

function sortAdminProducts(products: Product[], sort: string) {
  switch (sort) {
    case "name-asc":
      return [...products].sort((left, right) =>
        left.name.localeCompare(right.name, "id-ID"),
      );
    case "name-desc":
      return [...products].sort((left, right) =>
        right.name.localeCompare(left.name, "id-ID"),
      );
    case "latest":
    case "popular":
    case "promo":
    case "price-asc":
    case "price-desc":
    default:
      return sortCatalogProducts(products, sort as CatalogSort);
  }
}

function createStats(products: Product[]) {
  return [
    { label: "Total SKU", value: String(products.length) },
    {
      label: "Produk Promo",
      value: String(
        products.filter((product) => product.compareAtPrice).length,
      ),
    },
    {
      label: "Stok Tipis",
      value: String(
        products.filter((product) => product.stock > 0 && product.stock <= 12)
          .length,
      ),
    },
  ];
}

function createTextAreaValue(values: string[]) {
  return values.join("\n");
}

function createSpecificationValue(specifications: ProductSpecification[]) {
  return specifications
    .map((item) => `${item.label}: ${item.value}`)
    .join("\n");
}

function getStockBadgeClass(stock: number) {
  if (stock < 1) {
    return "border border-line text-ink-soft";
  }

  if (stock <= 12) {
    return "bg-accent-soft text-accent";
  }

  return "bg-brand-soft text-brand-deep";
}

function getStockLabel(stock: number) {
  if (stock < 1) {
    return "Backorder";
  }

  if (stock <= 12) {
    return "Stok tipis";
  }

  return "Aman";
}

function ProductFormFields({
  product,
  brandOptions,
  vehicleOptions,
  categoryOptions,
  datalistPrefix,
}: ProductFormFieldsProps) {
  return (
    <>
      <input type="hidden" name="existingImage" value={product?.image ?? ""} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Nama produk
        </span>
        <input
          name="name"
          required
          defaultValue={product?.name ?? ""}
          placeholder="Contoh: Kampas Rem Depan Nissin Vario"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Slug produk
        </span>
        <input
          name="slug"
          defaultValue={product?.slug ?? ""}
          placeholder="Boleh dikosongkan, slug akan dibentuk dari nama produk"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          SKU
        </span>
        <input
          name="sku"
          required
          defaultValue={product?.sku ?? ""}
          placeholder="Contoh: NIS-VAR-KR-01"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Brand
        </span>
        <input
          name="brand"
          list={`${datalistPrefix}-brands`}
          required
          defaultValue={product?.brand ?? ""}
          placeholder="Contoh: Nissin"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
        <datalist id={`${datalistPrefix}-brands`}>
          {brandOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Kategori sparepart
        </span>
        <select
          name="category"
          required
          defaultValue={product?.category ?? categoryOptions[0] ?? ""}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Tipe kendaraan
        </span>
        <input
          name="vehicle"
          list={`${datalistPrefix}-vehicles`}
          required
          defaultValue={product?.vehicle ?? ""}
          placeholder="Contoh: Matic"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
        <datalist id={`${datalistPrefix}-vehicles`}>
          {vehicleOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Harga jual
        </span>
        <input
          name="price"
          type="number"
          min="0"
          step="100"
          required
          defaultValue={product?.price ?? 0}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Harga coret
        </span>
        <input
          name="compareAtPrice"
          type="number"
          min="0"
          step="100"
          defaultValue={product?.compareAtPrice ?? ""}
          placeholder="Kosongkan jika tidak promo"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Stok
        </span>
        <input
          name="stock"
          type="number"
          min="0"
          required
          defaultValue={product?.stock ?? 0}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Rating
        </span>
        <input
          name="rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          required
          defaultValue={product?.rating ?? 0}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Jumlah ulasan
        </span>
        <input
          name="reviewCount"
          type="number"
          min="0"
          required
          defaultValue={product?.reviewCount ?? 0}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Jumlah terjual
        </span>
        <input
          name="soldCount"
          type="number"
          min="0"
          required
          defaultValue={product?.soldCount ?? 0}
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Lead time
        </span>
        <input
          name="leadTime"
          defaultValue={product?.leadTime ?? "Hubungi admin"}
          placeholder="Contoh: Siap kirim hari ini"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Lokasi stok
        </span>
        <input
          name="location"
          defaultValue={product?.location ?? "Gudang pusat"}
          placeholder="Contoh: Gudang Jakarta"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Ringkasan singkat
        </span>
        <textarea
          name="shortDescription"
          required
          rows={3}
          defaultValue={product?.shortDescription ?? ""}
          placeholder="Ringkasan singkat yang tampil di card katalog."
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Deskripsi lengkap
        </span>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={product?.description ?? ""}
          placeholder="Deskripsi detail produk untuk halaman produk."
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Kode motor
        </span>
        <textarea
          name="motorCodes"
          rows={4}
          defaultValue={createTextAreaValue(product?.motorCodes ?? [])}
          placeholder="Satu kode per baris atau pisahkan dengan koma. Contoh: Honda KPH"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Kompatibilitas
        </span>
        <textarea
          name="compatibility"
          rows={4}
          defaultValue={createTextAreaValue(product?.compatibility ?? [])}
          placeholder="Satu item per baris. Contoh: Honda Vario 125 2023"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Spesifikasi
        </span>
        <textarea
          name="specifications"
          rows={5}
          defaultValue={createSpecificationValue(product?.specifications ?? [])}
          placeholder="Format per baris: Label: Nilai"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Tags
        </span>
        <textarea
          name="tags"
          rows={3}
          defaultValue={createTextAreaValue(product?.tags ?? [])}
          placeholder="Satu tag per baris atau pisahkan dengan koma."
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Badges
        </span>
        <textarea
          name="badges"
          rows={3}
          defaultValue={createTextAreaValue(product?.badges ?? [])}
          placeholder="Satu badge per baris. Contoh: Best Seller"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Accent from
        </span>
        <input
          name="accentFrom"
          defaultValue={product?.accentFrom ?? "#f6a25b"}
          placeholder="#f6a25b"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Accent to
        </span>
        <input
          name="accentTo"
          defaultValue={product?.accentTo ?? "#c85f34"}
          placeholder="#c85f34"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Accent glow
        </span>
        <input
          name="accentGlow"
          defaultValue={product?.accentGlow ?? "rgba(200, 95, 52, 0.24)"}
          placeholder="rgba(200, 95, 52, 0.24)"
          className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
        />
      </label>

      <div className="rounded-[1.4rem] border border-dashed border-line bg-white/70 p-4 md:col-span-2">
        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Foto Produk
            </p>
            {product ? (
              <div className="w-full max-w-[220px]">
                <ProductPreview product={product} compact className="h-40" />
              </div>
            ) : (
              <p className="text-sm leading-6 text-ink-soft">
                Upload foto utama produk. Jika belum ada foto, storefront akan
                memakai gambar default.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Upload foto baru
              </span>
              <input
                name="imageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-deep hover:file:bg-brand-soft/80 focus:border-brand"
              />
            </label>
            <p className="text-xs leading-6 text-ink-soft">
              Format yang didukung: JPG, PNG, WEBP, GIF. Maksimal 5 MB.
            </p>
            {product?.image ? (
              <label className="inline-flex items-center gap-3 rounded-[1.1rem] border border-line bg-white px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  name="removeImage"
                  className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                <span>
                  Hapus foto lama jika tidak ingin menampilkan gambar produk
                </span>
              </label>
            ) : null}
            {product?.image ? (
              <p className="text-xs leading-6 text-muted">
                Path saat ini: {product.image}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdminPageAccess({
    allowedRoles: ["admin"],
    allowedLevelCodes: ["admin", "admin-baregad"],
  });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const catalog = await getCatalog({ sort: "latest" });
  const products = catalog.items;
  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const brand = readSearchParam(resolvedSearchParams, "brand") ?? "";
  const category = readSearchParam(resolvedSearchParams, "category") ?? "";
  const vehicle = readSearchParam(resolvedSearchParams, "vehicle") ?? "";
  const motorCode = readSearchParam(resolvedSearchParams, "motorCode") ?? "";
  const stockStatus =
    readSearchParam(resolvedSearchParams, "stockStatus") ?? "";
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? adminProductSortOptions[0];
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const editProductId = readSearchParam(resolvedSearchParams, "edit") ?? "";

  const navigationSearchParams: SearchParamsRecord = {
    ...(resolvedSearchParams ?? {}),
    toast: undefined,
    toastType: undefined,
    success: undefined,
    error: undefined,
  };
  const listSearchParams: SearchParamsRecord = {
    ...navigationSearchParams,
    edit: undefined,
  };
  const listHref = buildAdminPageHref("/admin/produk", listSearchParams, {});
  const editProduct =
    products.find((product) => product.id === editProductId) ?? null;
  const editReturnHref = editProduct
    ? buildAdminPageHref("/admin/produk", navigationSearchParams, {
        edit: editProduct.id,
      })
    : listHref;

  const filteredProducts = sortAdminProducts(
    products.filter((product) => {
      if (
        !matchesTextQuery(
          [
            product.name,
            product.sku,
            product.brand,
            product.category,
            product.vehicle,
            product.shortDescription,
            ...product.motorCodes,
            ...product.tags,
          ],
          q,
        )
      ) {
        return false;
      }

      if (brand && product.brand !== brand) {
        return false;
      }
      if (category && product.category !== category) {
        return false;
      }
      if (vehicle && product.vehicle !== vehicle) {
        return false;
      }
      if (motorCode && !product.motorCodes.includes(motorCode)) {
        return false;
      }
      if (!matchesDateRange(product.updatedAt, dateFrom, dateTo)) {
        return false;
      }

      switch (stockStatus) {
        case "ready":
          return product.stock > 12;
        case "low":
          return product.stock > 0 && product.stock <= 12;
        case "backorder":
          return product.stock < 1;
        default:
          return true;
      }
    }),
    sort,
  );

  const pagination = paginateItems(filteredProducts, page, pageSize);
  const stats = createStats(filteredProducts);
  const categoryOptions = createSparepartCategoryOptions();

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Product management
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Kelola katalog, data produk, dan foto upload
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Master produk sekarang disiapkan untuk alur CRUD penuh, mulai dari
          data inti, harga, stok, kompatibilitas, sampai upload foto agar admin
          bisa mengelola katalog langsung dari dashboard.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="surface-panel rounded-[1.8rem] p-3.5"
          >
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-ink">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink">
              Tambah produk baru
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Isi data produk lengkap termasuk foto, spesifikasi,
              kompatibilitas, dan kode motor agar produk siap tampil di
              storefront.
            </p>
          </div>
          <AdminModal
            title="Tambah produk baru"
            description="Gunakan form ini untuk membuat produk baru beserta foto utama, harga, stok, spesifikasi, dan data kompatibilitas."
            triggerLabel="Tambah Produk"
            panelClassName="max-w-6xl"
          >
            <form
              action="/api/admin-products/create"
              method="post"
              encType="multipart/form-data"
              className="grid gap-3 md:grid-cols-2"
            >
              <input type="hidden" name="redirectTo" value={listHref} />
              <ProductFormFields
                brandOptions={catalog.options.brands}
                vehicleOptions={catalog.options.vehicles}
                categoryOptions={categoryOptions}
                datalistPrefix="create-product"
              />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
                >
                  Simpan Produk Baru
                </button>
              </div>
            </form>
          </AdminModal>
        </div>
      </section>

      {editProduct ? (
        <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Edit produk
              </h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                Perbarui data produk, foto, harga, stok, dan informasi tampil
                untuk {editProduct.name}.
              </p>
            </div>
            <Link
              href={listHref}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Tutup Edit
            </Link>
          </div>

          <form
            action="/api/admin-products/update"
            method="post"
            encType="multipart/form-data"
            className="mt-3.5 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={editProduct.id} />
            <input type="hidden" name="redirectTo" value={editReturnHref} />
            <ProductFormFields
              product={editProduct}
              brandOptions={catalog.options.brands}
              vehicleOptions={catalog.options.vehicles}
              categoryOptions={categoryOptions}
              datalistPrefix="edit-product"
            />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
              >
                Simpan Perubahan
              </button>
              <Link
                href={listHref}
                className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
              >
                Batal
              </Link>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Cari nama, SKU, kategori, brand, atau kode motor
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Contoh: kampas rem, Nissin, Honda KPH"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Brand
            </span>
            <select
              name="brand"
              defaultValue={brand}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua brand</option>
              {catalog.options.brands.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Kategori
            </span>
            <select
              name="category"
              defaultValue={category}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua kategori</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Tipe motor
            </span>
            <select
              name="vehicle"
              defaultValue={vehicle}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua tipe</option>
              {catalog.options.vehicles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Kode motor
            </span>
            <select
              name="motorCode"
              defaultValue={motorCode}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua kode</option>
              {catalog.options.motorCodes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Status stok
            </span>
            <select
              name="stockStatus"
              defaultValue={stockStatus}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua status</option>
              <option value="ready">Aman</option>
              <option value="low">Stok tipis</option>
              <option value="backorder">Backorder</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Urutkan
            </span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="latest">Produk terbaru</option>
              <option value="popular">Terlaris</option>
              <option value="promo">Promo terbesar</option>
              <option value="price-asc">Harga termurah</option>
              <option value="price-desc">Harga tertinggi</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Update dari tanggal
            </span>
            <input
              name="dateFrom"
              type="date"
              defaultValue={dateFrom ?? ""}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Update sampai tanggal
            </span>
            <input
              name="dateTo"
              type="date"
              defaultValue={dateTo ?? ""}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Tampilkan
            </span>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              {adminPageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} data
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2 xl:col-span-4">
            <button
              type="submit"
              className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Terapkan Filter
            </button>
            <Link
              href="/admin/produk"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Produk tidak ditemukan"
          description="Coba longgarkan filter brand, kategori, kode motor, tanggal update, atau status stok untuk melihat lebih banyak data."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Kode Motor</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((product) => {
                  const editHref = buildAdminPageHref(
                    "/admin/produk",
                    navigationSearchParams,
                    {
                      edit: product.id,
                    },
                  );

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-t border-line align-top",
                        editProduct?.id === product.id
                          ? "bg-brand-soft/20"
                          : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-[280px] items-start gap-3">
                          <div className="w-20 shrink-0">
                            <ProductPreview
                              product={product}
                              compact
                              className="h-16"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-ink">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                              {product.shortDescription}
                            </p>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {product.brand}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[180px] leading-6">
                          {product.motorCodes.length > 0
                            ? product.motorCodes.join(", ")
                            : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[132px]">
                          <p className="font-semibold text-ink">
                            {formatRupiah(product.price)}
                          </p>
                          {product.compareAtPrice ? (
                            <p className="text-xs text-muted line-through">
                              {formatRupiah(product.compareAtPrice)}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStockBadgeClass(product.stock)}`}
                        >
                          {getStockLabel(product.stock)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(product.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[104px] flex-wrap gap-2">
                          <AdminIconLink
                            href={editHref}
                            label={`Edit ${product.name}`}
                            icon={<EditIcon />}
                          />
                          <form
                            action="/api/admin-products/delete"
                            method="post"
                          >
                            <input type="hidden" name="id" value={product.id} />
                            <input
                              type="hidden"
                              name="imagePath"
                              value={product.image ?? ""}
                            />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={listHref}
                            />
                            <AdminIconButton
                              type="submit"
                              label={`Hapus ${product.name}`}
                              icon={<TrashIcon />}
                              tone="danger"
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableShell>

          <AdminTablePagination
            pathname="/admin/produk"
            searchParams={listSearchParams}
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
          />
        </>
      )}
    </div>
  );
}
