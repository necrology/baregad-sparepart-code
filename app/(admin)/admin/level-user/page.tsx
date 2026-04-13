"use client";

import Link from "next/link";
import {
  Suspense,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserLevel } from "@/entities/user-level/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminUserLevels } from "@/shared/api/admin-user-level-service";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import {
  adminPageSizeOptions,
  buildAdminPageHref,
  matchesDateRange,
  matchesTextQuery,
  paginateItems,
  readNumberSearchParam,
  readSearchParam,
  toSearchParamsRecord,
} from "@/shared/lib/admin-list";
import { buildToastHref } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/date";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";
import { AdminBusyOverlay } from "@/shared/ui/admin-busy-overlay";
import { AdminIconButton, AdminIconLink } from "@/shared/ui/admin-icon-action";
import { AdminModal } from "@/shared/ui/admin-modal";
import { CloseIcon, EditIcon, TrashIcon } from "@/shared/ui/app-icons";

const statusLabelMap = {
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

const levelSortOptions = ["newest", "oldest", "name-asc", "name-desc"] as const;

function sortLevels(levels: UserLevel[], sort: string) {
  const sortedLevels = [...levels];

  sortedLevels.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "name-asc":
        return left.name.localeCompare(right.name, "id-ID");
      case "name-desc":
        return right.name.localeCompare(left.name, "id-ID");
      case "newest":
      default:
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
    }
  });

  return sortedLevels;
}

function createStats(levels: UserLevel[]) {
  return [
    { label: "Total Hak Akses", value: String(levels.length) },
    {
      label: "Hak Akses Aktif",
      value: String(levels.filter((level) => level.status === "active").length),
    },
    {
      label: "Hak Akses Nonaktif",
      value: String(
        levels.filter((level) => level.status === "inactive").length,
      ),
    },
  ];
}

function getStatusBadgeClass(status: UserLevel["status"]) {
  if (status === "active") {
    return "bg-brand-soft text-brand-deep";
  }

  return "border border-line text-ink-soft";
}

function AdminUserLevelsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAllowed, isReady } = useAdminPageAccess({
    allowedRoles: ["admin"],
  });
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [busyState, setBusyState] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const resolvedSearchParams = toSearchParamsRecord(searchParams.entries());

  const loadLevels = useCallback(async () => {
    if (!token?.trim()) {
      return;
    }

    setLevels(await getAdminUserLevels(token));
  }, [token]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadLevels();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadLevels]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const didCreate = await handleMutation(
      "/admin/user-levels",
      "POST",
      {
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: String(formData.get("status") ?? "active"),
      },
      "Hak akses berhasil ditambahkan.",
      listHref,
      {
        title: "Menyimpan hak akses",
        description: "Sedang menyimpan hak akses yang baru dibuat.",
      },
    );

    if (didCreate) {
      form.reset();
      form.closest("dialog")?.close();
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const id = String(formData.get("id") ?? "").trim();

    await handleMutation(
      `/admin/user-levels/${id}`,
      "PUT",
      {
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: String(formData.get("status") ?? "active"),
      },
      "Perubahan hak akses berhasil disimpan.",
      editReturnHref,
      {
        title: "Menyimpan perubahan hak akses",
        description: "Sedang menyimpan perubahan hak akses.",
      },
    );
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Hapus hak akses "${name}"?`);

    if (!confirmed) {
      return;
    }

    await handleMutation(
      `/admin/user-levels/${id}`,
      "DELETE",
      undefined,
      "Hak akses berhasil dihapus.",
      listHref,
      {
        title: "Menghapus hak akses",
        description: "Sedang menghapus hak akses yang dipilih.",
      },
    );
  }

  if (!isReady || !isAllowed) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan daftar hak akses...
      </div>
    );
  }

  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status") ?? "";
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? levelSortOptions[0];
  const editLevelId = readSearchParam(resolvedSearchParams, "edit") ?? "";

  const navigationSearchParams = {
    ...resolvedSearchParams,
    toast: undefined,
    toastType: undefined,
    success: undefined,
    error: undefined,
  };
  const listSearchParams = {
    ...navigationSearchParams,
    edit: undefined,
  };
  const listHref = buildAdminPageHref("/admin/level-user", listSearchParams, {});
  const editLevel = levels.find((level) => level.id === editLevelId) ?? null;
  const editReturnHref = editLevel
    ? buildAdminPageHref("/admin/level-user", navigationSearchParams, {
        edit: editLevel.id,
      })
    : listHref;

  async function handleMutation(
    pathname: string,
    method: "POST" | "PUT" | "DELETE",
    payload: unknown,
    successMessage: string,
    errorRedirect = listHref,
    pendingState?: {
      title: string;
      description?: string;
    },
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

    setBusyState(
      pendingState ?? {
        title: "Memproses perubahan",
        description: "Mohon tunggu sebentar.",
      },
    );

    try {
      await backendFetchJson(pathname, {
        method,
        token,
        json: payload,
      });

      await loadLevels();
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
              : "Hak akses belum bisa diproses.",
          tone: "error",
        }),
      );
      return false;
    } finally {
      setBusyState(null);
    }
  }

  const filteredLevels = sortLevels(
    levels.filter((level) => {
      if (!matchesTextQuery([level.name, level.code, level.description], q)) {
        return false;
      }

      if (status && level.status !== status) {
        return false;
      }

      return matchesDateRange(level.createdAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredLevels, page, pageSize);
  const stats = createStats(filteredLevels);

  return (
    <div className="space-y-3 sm:space-y-4">
      <AdminBusyOverlay
        visible={!!busyState}
        title={busyState?.title ?? ""}
        description={busyState?.description}
      />

      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Hak akses
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Kelola kelompok kerja tim toko
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Hak akses dipakai untuk mengelompokkan staff berdasarkan tugasnya.
          Dari sini Anda bisa menambah, mengubah, atau menonaktifkan kelompok
          yang dipakai tim toko.
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
              Tambah hak akses
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Form dibuat dalam modal supaya daftar kelompok kerja tetap ringkas
              dan mudah dipantau.
            </p>
          </div>
          <AdminModal
            title="Tambah hak akses"
            description="Buat kelompok kerja baru seperti operator gudang, admin produk, atau tim layanan agar pengelolaan akun makin rapi."
            triggerLabel="Tambah Hak Akses"
          >
            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Nama hak akses
                </span>
                <input
                  name="name"
                  required
                  placeholder="Contoh: Operator Gudang"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Kode hak akses
                </span>
                <input
                  name="code"
                  required
                  placeholder="contoh: operator-gudang"
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Deskripsi
                </span>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Jelaskan tugas utama hak akses ini di toko."
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
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
                >
                  Simpan Hak Akses
                </button>
              </div>
            </form>
          </AdminModal>
        </div>
      </section>

      {editLevel ? (
        <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Edit hak akses
              </h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                Perbarui nama, kode, deskripsi, dan status untuk hak akses{" "}
                {editLevel.name}.
              </p>
            </div>
            <AdminIconLink
              href={listHref}
              label="Tutup edit hak akses"
              icon={<CloseIcon />}
              tone="danger"
            />
          </div>

          <form
            key={editLevel.id}
            onSubmit={handleUpdate}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={editLevel.id} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Nama hak akses
              </span>
              <input
                name="name"
                required
                defaultValue={editLevel.name}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Kode hak akses
              </span>
              <input
                name="code"
                required
                defaultValue={editLevel.code}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Deskripsi
              </span>
              <textarea
                name="description"
                rows={4}
                defaultValue={editLevel.description}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Status
              </span>
              <select
                name="status"
                defaultValue={editLevel.status}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
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
                Cari nama, kode, atau deskripsi hak akses
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Contoh: gudang, operator-gudang, layanan-pelanggan"
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
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
              Dibuat dari tanggal
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
              Dibuat sampai tanggal
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
              <option value="newest">Hak akses terbaru</option>
              <option value="oldest">Hak akses terlama</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
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
              href="/admin/level-user"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Hak akses tidak ditemukan"
          description="Coba longgarkan filter nama, kode, status, atau tanggal agar data yang dicari lebih mudah terlihat."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((level) => {
                  const editHref = buildAdminPageHref(
                    "/admin/level-user",
                    navigationSearchParams,
                    { edit: level.id },
                  );

                  return (
                    <tr
                      key={level.id}
                      className={cn(
                        "border-t border-line align-top",
                        editLevel?.id === level.id ? "bg-brand-soft/20" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-[180px]">
                          <p className="font-semibold text-ink">{level.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                          {level.code}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <p className="min-w-[260px] leading-6">
                          {level.description || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(level.status)}`}
                        >
                          {statusLabelMap[level.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(level.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(level.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[104px] flex-wrap gap-2">
                          <AdminIconLink
                            href={editHref}
                            label={`Edit ${level.name}`}
                            icon={<EditIcon />}
                          />
                          <AdminIconButton
                            label={`Hapus ${level.name}`}
                            icon={<TrashIcon />}
                            tone="danger"
                            onClick={() => handleDelete(level.id, level.name)}
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
            pathname="/admin/level-user"
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

export default function AdminUserLevelsPage() {
  return (
    <Suspense fallback={null}>
      <AdminUserLevelsPageContent />
    </Suspense>
  );
}
