import Link from "next/link";
import type { AppParameter } from "@/entities/app-parameter/model/types";
import { getAdminAppParameters } from "@/shared/api/admin-app-parameter-service";
import { requireAdminPageAccess } from "@/shared/auth/admin-page-access";
import { isImageOrIconValue } from "@/shared/lib/admin-app-asset-form";
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
import { formatDate } from "@/shared/lib/date";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";
import { AdminIconButton, AdminIconLink } from "@/shared/ui/admin-icon-action";
import { AdminModal } from "@/shared/ui/admin-modal";
import { EditIcon, TrashIcon } from "@/shared/ui/app-icons";

type AdminAppParametersPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const statusLabelMap = {
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

const appParameterSortOptions = [
  "newest",
  "oldest",
  "updated-asc",
  "label-asc",
  "label-desc",
  "key-asc",
  "key-desc",
  "group-asc",
] as const;

function sortParameters(parameters: AppParameter[], sort: string) {
  const sortedParameters = [...parameters];

  sortedParameters.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "updated-asc":
        return (
          new Date(left.updatedAt).getTime() -
          new Date(right.updatedAt).getTime()
        );
      case "label-asc":
        return left.label.localeCompare(right.label, "id-ID");
      case "label-desc":
        return right.label.localeCompare(left.label, "id-ID");
      case "key-asc":
        return left.key.localeCompare(right.key, "id-ID");
      case "key-desc":
        return right.key.localeCompare(left.key, "id-ID");
      case "group-asc":
        return left.groupName.localeCompare(right.groupName, "id-ID");
      case "newest":
      default:
        return (
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
        );
    }
  });

  return sortedParameters;
}

function createStats(parameters: AppParameter[]) {
  return [
    { label: "Total Parameter", value: String(parameters.length) },
    {
      label: "Parameter Publik",
      value: String(
        parameters.filter((parameter) => parameter.isPublic).length,
      ),
    },
    {
      label: "Parameter Aktif",
      value: String(
        parameters.filter((parameter) => parameter.status === "active").length,
      ),
    },
  ];
}

function createGroupOptions(parameters: AppParameter[]) {
  return Array.from(new Set(parameters.map((parameter) => parameter.groupName)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "id-ID"));
}

function buildValuePreview(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (!normalizedValue) {
    return "-";
  }

  if (normalizedValue.length <= 100) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 97)}...`;
}

function isAssetParameter(
  parameter: Pick<AppParameter, "key" | "value"> | null,
) {
  if (!parameter) {
    return false;
  }

  return (
    /(logo|icon|favicon|image)/i.test(parameter.key) ||
    isImageOrIconValue(parameter.value)
  );
}

function getStatusBadgeClass(status: AppParameter["status"]) {
  if (status === "active") {
    return "bg-brand-soft text-brand-deep";
  }

  return "border border-line text-ink-soft";
}

function getVisibilityBadgeClass(isPublic: boolean) {
  if (isPublic) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "border border-line bg-white/70 text-ink-soft";
}

export default async function AdminAppParametersPage({
  searchParams,
}: AdminAppParametersPageProps) {
  await requireAdminPageAccess({ allowedRoles: ["admin"] });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const parameters = await getAdminAppParameters();
  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const group = readSearchParam(resolvedSearchParams, "group") ?? "";
  const visibility = readSearchParam(resolvedSearchParams, "visibility") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status") ?? "";
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? appParameterSortOptions[0];
  const editParameterId = readSearchParam(resolvedSearchParams, "edit") ?? "";

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
  const listHref = buildAdminPageHref(
    "/admin/parameter-aplikasi",
    listSearchParams,
    {},
  );
  const editParameter =
    parameters.find((parameter) => parameter.id === editParameterId) ?? null;
  const editReturnHref = editParameter
    ? buildAdminPageHref("/admin/parameter-aplikasi", navigationSearchParams, {
        edit: editParameter.id,
      })
    : listHref;
  const groupOptions = createGroupOptions(parameters);

  const filteredParameters = sortParameters(
    parameters.filter((parameter) => {
      if (
        !matchesTextQuery(
          [
            parameter.label,
            parameter.key,
            parameter.groupName,
            parameter.value,
            parameter.description,
          ],
          q,
        )
      ) {
        return false;
      }

      if (group && parameter.groupName !== group) {
        return false;
      }

      if (visibility === "public" && !parameter.isPublic) {
        return false;
      }

      if (visibility === "internal" && parameter.isPublic) {
        return false;
      }

      if (status && parameter.status !== status) {
        return false;
      }

      return matchesDateRange(parameter.updatedAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredParameters, page, pageSize);
  const stats = createStats(filteredParameters);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Application parameter management
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Kelola informasi aplikasi dari database
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Semua identitas aplikasi seperti nama brand, deskripsi, logo, favicon,
          label WhatsApp, sampai metadata SEO bisa dipusatkan ke parameter
          database agar perubahan tidak perlu lagi lewat edit source code.
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
              Tambah parameter aplikasi
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Gunakan master ini untuk menyimpan konfigurasi global aplikasi
              seperti `app_name`, `logo_url`, `favicon_url`, atau teks label
              lain yang perlu diubah dari dashboard.
            </p>
          </div>
          <AdminModal
            title="Tambah parameter aplikasi"
            description="Buat parameter baru untuk branding, teks storefront, atau konfigurasi publik/internal yang ingin dikelola melalui database."
            triggerLabel="Tambah Parameter"
            panelClassName="max-w-4xl"
          >
            <form
              action="/api/admin-app-parameters/create"
              method="post"
              encType="multipart/form-data"
              className="grid gap-3 md:grid-cols-2"
            >
              <input type="hidden" name="redirectTo" value={listHref} />
              <input type="hidden" name="existingValue" value="" />
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Label parameter
                </span>
                <input
                  name="label"
                  required
                  placeholder="Contoh: Nama Aplikasi"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Key parameter
                </span>
                <input
                  name="key"
                  required
                  placeholder="Contoh: app_name"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Grup parameter
                </span>
                <input
                  name="groupName"
                  required
                  defaultValue="general"
                  placeholder="Contoh: branding"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Nilai parameter
                </span>
                <textarea
                  name="value"
                  required
                  rows={5}
                  placeholder="Isi nilai parameter. Bisa berupa teks, URL logo, URL favicon, atau daftar keyword."
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <div className="rounded-[1.4rem] border border-dashed border-line bg-white/70 p-4 md:col-span-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Upload Aset
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">
                      Untuk parameter gambar atau icon seperti `logo_url`,
                      `favicon_url`, `icon_url`, atau aset visual lain, Anda
                      bisa upload file langsung. Jika file dipilih, nilainya
                      akan otomatis memakai path upload dan menggantikan input
                      manual.
                    </p>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                      File gambar/icon
                    </span>
                    <input
                      name="assetFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg"
                      className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-deep hover:file:bg-brand-soft/80 focus:border-brand"
                    />
                  </label>
                  <p className="text-xs leading-6 text-ink-soft">
                    Format yang didukung: JPG, PNG, WEBP, GIF, SVG, ICO.
                    Maksimal 5 MB.
                  </p>
                </div>
              </div>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Deskripsi
                </span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Jelaskan penggunaan parameter ini agar mudah dikelola oleh admin lain."
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="inline-flex items-center gap-3 rounded-[1.25rem] border border-line bg-white/70 px-4 py-3 text-sm text-ink md:col-span-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  defaultChecked
                  className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                <span>
                  Jadikan parameter publik agar boleh dipakai storefront dan
                  metadata aplikasi
                </span>
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
                >
                  Simpan Parameter Baru
                </button>
              </div>
            </form>
          </AdminModal>
        </div>
      </section>

      {editParameter ? (
        <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Edit parameter aplikasi
              </h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                Perbarui key, grup, value, dan visibilitas untuk parameter{" "}
                {editParameter.label}.
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
            action="/api/admin-app-parameters/update"
            method="post"
            encType="multipart/form-data"
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={editParameter.id} />
            <input type="hidden" name="redirectTo" value={editReturnHref} />
            <input
              type="hidden"
              name="existingValue"
              value={editParameter.value}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Label parameter
              </span>
              <input
                name="label"
                required
                defaultValue={editParameter.label}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Key parameter
              </span>
              <input
                name="key"
                required
                defaultValue={editParameter.key}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Grup parameter
              </span>
              <input
                name="groupName"
                required
                defaultValue={editParameter.groupName}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Status
              </span>
              <select
                name="status"
                defaultValue={editParameter.status}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Nilai parameter
              </span>
              <textarea
                name="value"
                required
                rows={5}
                defaultValue={editParameter.value}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <div className="rounded-[1.4rem] border border-dashed border-line bg-white/70 p-4 md:col-span-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Upload Aset
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    Upload file baru jika parameter ini menyimpan logo, favicon,
                    icon, atau gambar lain. Jika file dipilih, path upload akan
                    otomatis menggantikan nilai saat ini.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    File gambar/icon
                  </span>
                  <input
                    name="assetFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg"
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-deep hover:file:bg-brand-soft/80 focus:border-brand"
                  />
                </label>
                {isAssetParameter(editParameter) ? (
                  <>
                    <p className="text-xs leading-6 text-muted">
                      Nilai aset saat ini: {editParameter.value}
                    </p>
                    <label className="inline-flex items-center gap-3 rounded-[1.15rem] border border-line bg-white px-4 py-3 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="removeAsset"
                        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                      />
                      <span>
                        Hapus file aset lama setelah nilai parameter diganti
                      </span>
                    </label>
                  </>
                ) : null}
                <p className="text-xs leading-6 text-ink-soft">
                  Format yang didukung: JPG, PNG, WEBP, GIF, SVG, ICO. Maksimal
                  5 MB.
                </p>
              </div>
            </div>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Deskripsi
              </span>
              <textarea
                name="description"
                rows={3}
                defaultValue={editParameter.description}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="inline-flex items-center gap-3 rounded-[1.25rem] border border-line bg-white/70 px-4 py-3 text-sm text-ink md:col-span-2">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={editParameter.isPublic}
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
              />
              <span>
                Izinkan parameter ini dipakai di area publik storefront
              </span>
            </label>
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
              Cari label, key, grup, value, atau deskripsi
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Contoh: logo, favicon, app_name, branding"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Grup
            </span>
            <select
              name="group"
              defaultValue={group}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua grup</option>
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Visibilitas
            </span>
            <select
              name="visibility"
              defaultValue={visibility}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua visibilitas</option>
              <option value="public">Publik</option>
              <option value="internal">Internal</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Status
            </span>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
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
              Urutkan
            </span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="newest">Update terbaru</option>
              <option value="updated-asc">Update terlama</option>
              <option value="oldest">Dibuat terlama</option>
              <option value="label-asc">Label A-Z</option>
              <option value="label-desc">Label Z-A</option>
              <option value="key-asc">Key A-Z</option>
              <option value="key-desc">Key Z-A</option>
              <option value="group-asc">Grup A-Z</option>
            </select>
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
              href="/admin/parameter-aplikasi"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Parameter aplikasi tidak ditemukan"
          description="Coba longgarkan filter pencarian, grup, visibilitas, atau status agar parameter yang dicari lebih mudah terlihat."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Grup</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Visibilitas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((parameter) => {
                  const editHref = buildAdminPageHref(
                    "/admin/parameter-aplikasi",
                    navigationSearchParams,
                    { edit: parameter.id },
                  );

                  return (
                    <tr
                      key={parameter.id}
                      className={cn(
                        "border-t border-line align-top",
                        editParameter?.id === parameter.id
                          ? "bg-brand-soft/20"
                          : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-[220px]">
                          <p className="font-semibold text-ink">
                            {parameter.label}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-ink-soft">
                            {parameter.description || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="min-w-[180px] text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                          {parameter.key}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-ink-soft">
                          {parameter.groupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[280px] space-y-1">
                          {isAssetParameter(parameter) ? (
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
                              Aset gambar/icon
                            </p>
                          ) : null}
                          <p className="leading-6 break-all">
                            {buildValuePreview(parameter.value)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getVisibilityBadgeClass(parameter.isPublic)}`}
                        >
                          {parameter.isPublic ? "Publik" : "Internal"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(parameter.status)}`}
                        >
                          {statusLabelMap[parameter.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[132px] space-y-1">
                          <p>{formatDate(parameter.updatedAt)}</p>
                          <p className="text-xs text-muted">
                            dibuat {formatDate(parameter.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[104px] flex-wrap gap-2">
                          <AdminIconLink
                            href={editHref}
                            label={`Edit ${parameter.label}`}
                            icon={<EditIcon />}
                          />
                          <form
                            action="/api/admin-app-parameters/delete"
                            method="post"
                          >
                            <input
                              type="hidden"
                              name="id"
                              value={parameter.id}
                            />
                            <input
                              type="hidden"
                              name="value"
                              value={parameter.value}
                            />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={listHref}
                            />
                            <AdminIconButton
                              type="submit"
                              label={`Hapus ${parameter.label}`}
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
            pathname="/admin/parameter-aplikasi"
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
