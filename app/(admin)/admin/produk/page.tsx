"use client";

import Link from "next/link";
import {
  Suspense,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCatalog } from "@/entities/product/api/product-service";
import { sortCatalogProducts } from "@/entities/product/model/catalog";
import {
  DEFAULT_PRODUCT_IMAGE,
  getProductImageSrc,
} from "@/entities/product/model/product-images";
import { createSparepartCategoryOptions } from "@/entities/product/model/sparepart-category";
import type { CatalogSort, Product } from "@/entities/product/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { uploadAdminAsset } from "@/shared/api/admin-upload-service";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import {
  buildProductPayload,
  defaultProductAccent,
} from "@/shared/lib/admin-product-form";
import {
  adminPageSizeOptions,
  buildAdminPageHref,
  matchesTextQuery,
  paginateItems,
  readNumberSearchParam,
  readSearchParam,
  toSearchParamsRecord,
} from "@/shared/lib/admin-list";
import { cn } from "@/shared/lib/cn";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";
import { buildToastHref } from "@/shared/lib/toast";
import { AdminBusyOverlay } from "@/shared/ui/admin-busy-overlay";
import { AdminIconButton, AdminIconLink } from "@/shared/ui/admin-icon-action";
import { AdminModal } from "@/shared/ui/admin-modal";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";
import { CloseIcon, EditIcon, TrashIcon } from "@/shared/ui/app-icons";

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
    default:
      return sortCatalogProducts(products, sort as CatalogSort);
  }
}

function ProductFields({
  product,
  brandOptions,
  vehicleOptions,
  categoryOptions,
}: {
  product?: Product | null;
  brandOptions: string[];
  vehicleOptions: string[];
  categoryOptions: string[];
}) {
  const brandOptionsId = useId();
  const vehicleOptionsId = useId();
  const hasProduct = !!product;
  const joinSpecs = (items: Product["specifications"] = []) =>
    items.map((item) => `${item.label}: ${item.value}`).join("\n");
  const joinLines = (items: string[] = []) => items.join("\n");
  const fieldClassName =
    "w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft placeholder:opacity-100 focus:border-brand";
  const fileFieldClassName =
    "w-full rounded-xl border border-dashed border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-deep hover:border-brand";

  return (
    <>
      <input
        name="name"
        required
        defaultValue={product?.name ?? ""}
        placeholder="Nama produk, contoh: Kampas Rem Depan Vario 160"
        className={fieldClassName}
      />
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Nama link produk di website
        </span>
        <input
          name="slug"
          defaultValue={product?.slug ?? ""}
          placeholder="Kosongkan saja jika ingin dibuat otomatis dari nama produk"
          className={fieldClassName}
        />
        <span className="mt-1 block text-xs text-ink-soft">
          Dipakai pada alamat halaman produk, misalnya `kampas-rem-vario-160`.
        </span>
      </label>
      <input
        name="sku"
        required
        defaultValue={product?.sku ?? ""}
        placeholder="Kode produk internal, contoh: KRM-V160-001"
        className={fieldClassName}
      />
      <input
        name="brand"
        list={brandOptionsId}
        required
        defaultValue={product?.brand ?? ""}
        placeholder="Merek produk, contoh: Honda Genuine Parts"
        className={fieldClassName}
      />
      <datalist id={brandOptionsId}>
        {brandOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <select
        name="category"
        required
        defaultValue={product?.category ?? categoryOptions[0] ?? ""}
        className={fieldClassName}
      >
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        name="vehicle"
        list={vehicleOptionsId}
        required
        defaultValue={product?.vehicle ?? ""}
        placeholder="Tipe kendaraan, contoh: Vario 160"
        className={fieldClassName}
      />
      <datalist id={vehicleOptionsId}>
        {vehicleOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <input
        name="price"
        type="number"
        min="0"
        step="100"
        required
        defaultValue={hasProduct ? product.price : ""}
        placeholder="Harga jual, contoh: 150000"
        className={fieldClassName}
      />
      <input
        name="stock"
        type="number"
        min="0"
        required
        defaultValue={hasProduct ? product.stock : ""}
        placeholder="Jumlah stok, contoh: 24"
        className={fieldClassName}
      />
      <input
        name="rating"
        type="number"
        min="0"
        max="5"
        step="0.1"
        required
        defaultValue={hasProduct ? product.rating : ""}
        placeholder="Rating produk, contoh: 4.8"
        className={fieldClassName}
      />
      <input
        name="reviewCount"
        type="number"
        min="0"
        required
        defaultValue={hasProduct ? product.reviewCount : ""}
        placeholder="Jumlah ulasan, contoh: 12"
        className={fieldClassName}
      />
      <input
        name="soldCount"
        type="number"
        min="0"
        required
        defaultValue={hasProduct ? product.soldCount : ""}
        placeholder="Jumlah terjual, contoh: 80"
        className={fieldClassName}
      />
      <input
        name="leadTime"
        defaultValue={product?.leadTime ?? "Hubungi admin"}
        placeholder="Estimasi proses, contoh: Dikirim hari ini"
        className={fieldClassName}
      />
      <input
        name="location"
        defaultValue={product?.location ?? "Gudang pusat"}
        placeholder="Lokasi stok, contoh: Gudang pusat"
        className={fieldClassName}
      />
      <input
        name="image"
        defaultValue={product?.image ?? ""}
        placeholder="Alamat gambar produk jika tidak upload file"
        className={`md:col-span-2 ${fieldClassName}`}
      />
      <label className="md:col-span-2 block">
        <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
          Upload gambar produk
        </span>
        <input
          name="imageFile"
          type="file"
          accept="image/*,.svg,.ico"
          className={fileFieldClassName}
        />
        <span className="mt-1 block text-xs text-ink-soft">
          Opsional. Jika file dipilih, gambar akan diunggah lalu langsung dipakai
          untuk barang ini.
        </span>
      </label>
      <textarea
        name="shortDescription"
        required
        rows={3}
        defaultValue={product?.shortDescription ?? ""}
        placeholder="Ringkasan singkat yang tampil di kartu produk"
        className={`md:col-span-2 ${fieldClassName}`}
      />
      <textarea
        name="description"
        required
        rows={4}
        defaultValue={product?.description ?? ""}
        placeholder="Deskripsi lengkap produk"
        className={`md:col-span-2 ${fieldClassName}`}
      />
      <textarea
        name="motorCodes"
        rows={3}
        defaultValue={joinLines(product?.motorCodes)}
        placeholder="Kode motor, pisahkan dengan baris baru atau koma"
        className={fieldClassName}
      />
      <textarea
        name="compatibility"
        rows={3}
        defaultValue={joinLines(product?.compatibility)}
        placeholder="Motor yang cocok, pisahkan dengan baris baru atau koma"
        className={fieldClassName}
      />
      <textarea
        name="specifications"
        rows={4}
        defaultValue={joinSpecs(product?.specifications)}
        placeholder="Format: Nama spesifikasi: Nilai"
        className={`md:col-span-2 ${fieldClassName}`}
      />
      <textarea
        name="tags"
        rows={3}
        defaultValue={joinLines(product?.tags)}
        placeholder="Kata kunci pencarian, pisahkan dengan baris baru atau koma"
        className={fieldClassName}
      />
      <textarea
        name="badges"
        rows={3}
        defaultValue={joinLines(product?.badges)}
        placeholder="Label tambahan, contoh: Best Seller"
        className={fieldClassName}
      />
      <details className="md:col-span-2 rounded-[1.4rem] border border-line bg-white/70 p-4">
        <summary className="text-sm font-semibold text-ink">
          Warna tampilan kartu produk
        </summary>
        <p className="mt-2 text-xs leading-6 text-ink-soft">
          Boleh dibiarkan default. Bagian ini hanya mengatur nuansa warna kartu
          produk di katalog.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            name="accentFrom"
            defaultValue={product?.accentFrom ?? defaultProductAccent.from}
            placeholder="Warna awal gradasi, contoh: #f6a25b"
            className={fieldClassName}
          />
          <input
            name="accentTo"
            defaultValue={product?.accentTo ?? defaultProductAccent.to}
            placeholder="Warna akhir gradasi, contoh: #c85f34"
            className={fieldClassName}
          />
          <input
            name="accentGlow"
            defaultValue={product?.accentGlow ?? defaultProductAccent.glow}
            placeholder="Efek glow, contoh: rgba(200, 95, 52, 0.24)"
            className={`md:col-span-2 ${fieldClassName}`}
          />
        </div>
      </details>
    </>
  );
}

function AdminProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAllowed, isReady } = useAdminPageAccess({
    allowedRoles: ["admin"],
    allowedLevelCodes: ["admin", "admin-baregad"],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [busyState, setBusyState] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const [createFormVersion, setCreateFormVersion] = useState(0);
  const paramsRecord = toSearchParamsRecord(searchParams.entries());
  const categoryOptions = createSparepartCategoryOptions();

  const loadCatalog = useCallback(async () => {
    const catalog = await getCatalog({ sort: "latest" });
    setProducts(catalog.items);
    setBrandOptions(catalog.options.brands);
    setVehicleOptions(catalog.options.vehicles);
  }, []);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadCatalog();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadCatalog]);

  if (!isReady || !isAllowed) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan daftar barang...
      </div>
    );
  }

  const page = readNumberSearchParam(paramsRecord, "page", 1);
  const pageSize = readNumberSearchParam(
    paramsRecord,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(paramsRecord, "q") ?? "";
  const brand = readSearchParam(paramsRecord, "brand") ?? "";
  const category = readSearchParam(paramsRecord, "category") ?? "";
  const vehicle = readSearchParam(paramsRecord, "vehicle") ?? "";
  const stockStatus = readSearchParam(paramsRecord, "stockStatus") ?? "";
  const sort = readSearchParam(paramsRecord, "sort") ?? "latest";
  const editId = readSearchParam(paramsRecord, "edit") ?? "";

  const navParams = {
    ...paramsRecord,
    toast: undefined,
    toastType: undefined,
    success: undefined,
    error: undefined,
  };
  const listParams = {
    ...navParams,
    edit: undefined,
  };
  const listHref = buildAdminPageHref("/admin/produk", listParams, {});
  const editProduct = products.find((item) => item.id === editId) ?? null;
  const editHref = editProduct
    ? buildAdminPageHref("/admin/produk", navParams, { edit: editProduct.id })
    : listHref;

  async function handleMutation(
    pathname: string,
    method: "POST" | "PUT" | "DELETE",
    payload: unknown,
    successMessage: string,
    errorRedirect = listHref,
  ) {
    if (!token?.trim()) {
      router.replace(
        buildToastHref(errorRedirect, {
          message: "Sesi login tidak ditemukan.",
          tone: "error",
        }),
      );
      return false;
    }

    try {
      await backendFetchJson(pathname, { method, token, json: payload });
      await loadCatalog();
      router.replace(
        buildToastHref(listHref, {
          message: successMessage,
          tone: "success",
        }),
      );
      return true;
    } catch (error) {
      router.replace(
        buildToastHref(errorRedirect, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Data barang belum bisa diproses.",
          tone: "error",
        }),
      );
      return false;
    }
  }

  async function uploadProductImage(formData: FormData) {
    if (!token?.trim()) {
      return null;
    }

    const imageFile = formData.get("imageFile");

    if (!(imageFile instanceof File) || imageFile.size < 1) {
      return null;
    }

    return uploadAdminAsset({
      token,
      file: imageFile,
      scope: "product-images",
      kind: "image",
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dialog = form.closest("dialog");
    const formData = new FormData(form);
    let didCreate = false;

    setBusyState({
      title: "Menyimpan barang",
      description: "Sedang menyimpan data barang dan gambar.",
    });

    try {
      const uploadedImage = await uploadProductImage(formData);

      if (uploadedImage) {
        formData.set("image", uploadedImage.path);
      }

      didCreate = await handleMutation(
        "/admin/products",
        "POST",
        buildProductPayload(formData),
        "Barang berhasil ditambahkan.",
      );
    } catch (error) {
      router.replace(
        buildToastHref(listHref, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Gambar barang belum bisa diunggah.",
          tone: "error",
        }),
      );
    } finally {
      setBusyState(null);

      if (didCreate) {
        form.reset();
        dialog?.close();
        setCreateFormVersion((current) => current + 1);
      }
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = String(formData.get("id") ?? "").trim();

    setBusyState({
      title: "Menyimpan perubahan barang",
      description: "Sedang menyimpan perubahan data barang.",
    });

    try {
      const uploadedImage = await uploadProductImage(formData);

      if (uploadedImage) {
        formData.set("image", uploadedImage.path);
      }

      await handleMutation(
        `/admin/products/${id}`,
        "PUT",
        buildProductPayload(formData),
        "Perubahan barang berhasil disimpan.",
        editHref,
      );
    } catch (error) {
      router.replace(
        buildToastHref(editHref, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Gambar barang belum bisa diunggah.",
          tone: "error",
        }),
      );
    } finally {
      setBusyState(null);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Hapus barang "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    setBusyState({
      title: "Menghapus barang",
      description: "Sedang menghapus barang dari daftar.",
    });

    try {
      await handleMutation(
        `/admin/products/${product.id}`,
        "DELETE",
        undefined,
        "Barang berhasil dihapus.",
      );
    } finally {
      setBusyState(null);
    }
  }

  const filteredProducts = sortAdminProducts(
    products.filter((product) => {
      if (
        !matchesTextQuery(
          [
            product.name,
            product.sku,
            product.brand,
            product.category,
            product.shortDescription,
            ...product.motorCodes,
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

      if (stockStatus === "ready" && product.stock < 1) {
        return false;
      }

      if (stockStatus === "low" && !(product.stock > 0 && product.stock <= 12)) {
        return false;
      }

      if (stockStatus === "backorder" && product.stock > 0) {
        return false;
      }

      return true;
    }),
    sort,
  );

  const pagination = paginateItems(filteredProducts, page, pageSize);

  return (
    <div className="space-y-4">
      <AdminBusyOverlay
        visible={!!busyState}
        title={busyState?.title ?? ""}
        description={busyState?.description}
      />

      <section className="surface-panel rounded-[2rem] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Daftar barang
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Kelola katalog barang
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Atur nama barang, foto, stok, dan informasi penting lainnya dari
              satu tempat.
            </p>
          </div>
          <AdminModal
            title="Tambah Barang"
            description="Lengkapi informasi barang lalu simpan."
            triggerLabel="Tambah Barang"
            panelClassName="max-w-6xl"
          >
            <form
              key={createFormVersion}
              onSubmit={handleCreate}
              className="grid gap-3 md:grid-cols-2"
            >
              <ProductFields
                brandOptions={brandOptions}
                vehicleOptions={vehicleOptions}
                categoryOptions={categoryOptions}
              />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!!busyState}
                  className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white/70 disabled:text-muted"
                >
                  {busyState ? "Memproses..." : "Simpan Barang"}
                </button>
              </div>
            </form>
          </AdminModal>
        </div>
      </section>

      {editProduct ? (
        <section className="surface-panel rounded-[2rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-ink">
              Edit {editProduct.name}
            </h3>
            <AdminIconLink
              href={listHref}
              label="Tutup edit barang"
              icon={<CloseIcon />}
              tone="danger"
            />
          </div>
          <form
            key={editProduct.id}
            onSubmit={handleUpdate}
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={editProduct.id} />
            <input type="hidden" name="existingSlug" value={editProduct.slug} />
            <ProductFields
              product={editProduct}
              brandOptions={brandOptions}
              vehicleOptions={vehicleOptions}
              categoryOptions={categoryOptions}
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={!!busyState}
                className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white/70 disabled:text-muted"
              >
                {busyState ? "Memproses..." : "Simpan"}
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

      <section className="surface-panel rounded-[2rem] p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, kode barang, merek, kategori, atau kode motor"
            className="xl:col-span-2 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          />
          <select
            name="brand"
            defaultValue={brand}
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua merek</option>
            {brandOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
          <select
            name="vehicle"
            defaultValue={vehicle}
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua kendaraan</option>
            {vehicleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            name="stockStatus"
            defaultValue={stockStatus}
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua stok</option>
            <option value="ready">Aman</option>
            <option value="low">Stok tipis</option>
            <option value="backorder">Backorder</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="latest">Terbaru</option>
            <option value="popular">Terlaris</option>
            <option value="price-asc">Harga termurah</option>
            <option value="price-desc">Harga tertinggi</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
          </select>
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
          <div className="xl:col-span-5 flex gap-2">
            <button
              type="submit"
              className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Terapkan
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
          title="Barang tidak ditemukan"
          description="Coba longgarkan filter pencarian atau stok."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Merek</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Kode Motor</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((product) => {
                  const rowEditHref = buildAdminPageHref(
                    "/admin/produk",
                    navParams,
                    { edit: product.id },
                  );

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-t border-line align-top",
                        editProduct?.id === product.id ? "bg-brand-soft/20" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-[260px] items-start gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getProductImageSrc(product)}
                            alt={product.name}
                            width={72}
                            height={72}
                            loading="lazy"
                            className="h-[72px] w-[72px] rounded-2xl border border-line bg-white object-cover"
                            onError={(event) => {
                              event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink">{product.name}</p>
                            <p className="mt-1 text-xs text-ink-soft">
                              {product.sku} - {product.category}
                            </p>
                            <p className="mt-1 truncate text-xs text-ink-soft">
                              {product.image || "Belum ada gambar"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{product.brand}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">
                          {formatRupiah(product.price)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {product.motorCodes.join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(product.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[104px] flex-wrap gap-2">
                          <AdminIconLink
                            href={rowEditHref}
                            label={`Edit ${product.name}`}
                            icon={<EditIcon />}
                          />
                          <AdminIconButton
                            label={`Hapus ${product.name}`}
                            icon={<TrashIcon />}
                            tone="danger"
                            onClick={() => handleDelete(product)}
                          />
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
            searchParams={listParams}
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

export default function AdminProductsPage() {
  return (
    <Suspense fallback={null}>
      <AdminProductsPageContent />
    </Suspense>
  );
}
