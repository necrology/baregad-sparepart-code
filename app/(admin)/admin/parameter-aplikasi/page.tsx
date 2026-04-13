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
import type { AppParameter } from "@/entities/app-parameter/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import {
  type AdminUploadKind,
  uploadAdminAsset,
} from "@/shared/api/admin-upload-service";
import { getAdminAppParameters } from "@/shared/api/admin-app-parameter-service";
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
import {
  isImageOrIconValue,
  resolveAppParameterValue,
} from "@/shared/lib/admin-app-asset-form";
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

function sortParameters(items: AppParameter[], sort: string) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case "label-asc":
        return left.label.localeCompare(right.label, "id-ID");
      case "label-desc":
        return right.label.localeCompare(left.label, "id-ID");
      case "key-asc":
        return left.key.localeCompare(right.key, "id-ID");
      case "group-asc":
        return left.groupName.localeCompare(right.groupName, "id-ID");
      case "newest":
      default:
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }
  });

  return sorted;
}

function buildValuePreview(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  return normalizedValue.length > 80 ? `${normalizedValue.slice(0, 77)}...` : normalizedValue || "-";
}

function inferAssetKind(
  key: string | null | undefined,
  value: string | null | undefined,
): AdminUploadKind {
  const normalizedKey = key?.trim().toLowerCase() ?? "";

  if (
    isImageOrIconValue(value) ||
    /(logo|favicon|icon|image|banner)/.test(normalizedKey)
  ) {
    return "image";
  }

  return "file";
}

function AdminAppParametersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAllowed, isReady } = useAdminPageAccess({
    allowedRoles: ["admin"],
  });
  const [parameters, setParameters] = useState<AppParameter[]>([]);
  const [busyState, setBusyState] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const paramsRecord = toSearchParamsRecord(searchParams.entries());

  const loadParameters = useCallback(async () => {
    if (!token?.trim()) {
      return;
    }

    setParameters(await getAdminAppParameters(token));
  }, [token]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadParameters();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadParameters]);

  if (!isReady || !isAllowed) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan pengaturan tampilan...
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
  const group = readSearchParam(paramsRecord, "group") ?? "";
  const visibility = readSearchParam(paramsRecord, "visibility") ?? "";
  const status = readSearchParam(paramsRecord, "status") ?? "";
  const dateFrom = readSearchParam(paramsRecord, "dateFrom");
  const dateTo = readSearchParam(paramsRecord, "dateTo");
  const sort = readSearchParam(paramsRecord, "sort") ?? "newest";
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
  const listHref = buildAdminPageHref("/admin/parameter-aplikasi", listParams, {});
  const editParameter = parameters.find((item) => item.id === editId) ?? null;
  const editHref = editParameter
    ? buildAdminPageHref("/admin/parameter-aplikasi", navParams, { edit: editParameter.id })
    : listHref;
  const groupOptions = [...new Set(parameters.map((item) => item.groupName))].filter(Boolean).sort();

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
        title: "Memproses pengaturan",
        description: "Mohon tunggu sebentar.",
      },
    );

    try {
      await backendFetchJson(pathname, {
        method,
        token,
        json: payload,
      });
      await loadParameters();
      router.replace(buildToastHref(listHref, { message: successMessage, tone: "success" }));
      return true;
    } catch (error) {
      router.replace(
        buildToastHref(errorRedirect, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Pengaturan belum bisa diproses.",
          tone: "error",
        }),
      );
      return false;
    } finally {
      setBusyState(null);
    }
  }

  async function uploadParameterAsset(
    formData: FormData,
    fallbackKind: AdminUploadKind,
  ) {
    if (!token?.trim()) {
      return null;
    }

    const assetFile = formData.get("assetFile");

    if (!(assetFile instanceof File) || assetFile.size < 1) {
      return null;
    }

    const requestedKind = String(formData.get("assetKind") ?? fallbackKind).trim();
    const assetKind: AdminUploadKind =
      requestedKind === "file" ? "file" : "image";

    return uploadAdminAsset({
      token,
      file: assetFile,
      scope: "app-assets",
      kind: assetKind,
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fallbackKind = inferAssetKind(
      String(formData.get("key") ?? ""),
      String(formData.get("value") ?? ""),
    );

    try {
      const uploadedAsset = await uploadParameterAsset(formData, fallbackKind);

      if (uploadedAsset) {
        formData.set("value", uploadedAsset.path);
      }
    } catch (error) {
      router.replace(
        buildToastHref(listHref, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "File atau gambar belum bisa diunggah.",
          tone: "error",
        }),
      );
      return;
    }

    const value = resolveAppParameterValue(formData).value;

    const didCreate = await handleMutation(
      "/admin/app-parameters",
      "POST",
      {
        label: String(formData.get("label") ?? ""),
        key: String(formData.get("key") ?? ""),
        groupName: String(formData.get("groupName") ?? ""),
        value,
        description: String(formData.get("description") ?? ""),
        isPublic: formData.get("isPublic") === "on",
        status: String(formData.get("status") ?? "active"),
      },
      "Pengaturan berhasil ditambahkan.",
      listHref,
      {
        title: "Menyimpan pengaturan",
        description: "Sedang menyimpan nama, gambar, atau tulisan yang Anda ubah.",
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
    const fallbackKind = inferAssetKind(
      String(formData.get("key") ?? ""),
      String(formData.get("existingValue") ?? ""),
    );

    try {
      const uploadedAsset = await uploadParameterAsset(formData, fallbackKind);

      if (uploadedAsset) {
        formData.set("value", uploadedAsset.path);
      }
    } catch (error) {
      router.replace(
        buildToastHref(editHref, {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "File atau gambar belum bisa diunggah.",
          tone: "error",
        }),
      );
      return;
    }

    const value = resolveAppParameterValue(formData).value;

    await handleMutation(
      `/admin/app-parameters/${id}`,
      "PUT",
      {
        label: String(formData.get("label") ?? ""),
        key: String(formData.get("key") ?? ""),
        groupName: String(formData.get("groupName") ?? ""),
        value,
        description: String(formData.get("description") ?? ""),
        isPublic: formData.get("isPublic") === "on",
        status: String(formData.get("status") ?? "active"),
      },
      "Perubahan pengaturan berhasil disimpan.",
      editHref,
      {
        title: "Menyimpan perubahan pengaturan",
        description: "Sedang menyimpan perubahan nama, gambar, atau tulisan.",
      },
    );
  }

  async function handleDelete(item: AppParameter) {
    const confirmed = window.confirm(`Hapus pengaturan "${item.label}"?`);

    if (!confirmed) {
      return;
    }

    await handleMutation(
      `/admin/app-parameters/${item.id}`,
      "DELETE",
      undefined,
      "Pengaturan berhasil dihapus.",
      listHref,
      {
        title: "Menghapus pengaturan",
        description: "Sedang menghapus pengaturan yang dipilih.",
      },
    );
  }

  const filteredParameters = sortParameters(
    parameters.filter((item) => {
      if (!matchesTextQuery([item.label, item.key, item.groupName, item.value, item.description], q)) {
        return false;
      }

      if (group && item.groupName !== group) {
        return false;
      }

      if (visibility === "public" && !item.isPublic) {
        return false;
      }

      if (visibility === "internal" && item.isPublic) {
        return false;
      }

      if (status && item.status !== status) {
        return false;
      }

      return matchesDateRange(item.updatedAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredParameters, page, pageSize);

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
              Pengaturan
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Kelola nama toko, logo, ikon, dan tulisan yang tampil
            </h2>
          </div>
          <AdminModal
            title="Tambah Pengaturan"
            description="Simpan nama toko, logo, ikon, gambar, file, atau tulisan lain yang ingin ditampilkan."
            triggerLabel="Tambah Pengaturan"
            panelClassName="max-w-4xl"
          >
            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <input name="label" required placeholder="Nama pengaturan" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
              <input name="key" required placeholder="Kode pengaturan" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
              <input name="groupName" defaultValue="general" required placeholder="Kelompok" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
              <select name="status" defaultValue="active" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <textarea name="value" rows={4} placeholder="Isi tulisan, link gambar, atau daftar kata kunci" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand md:col-span-2" />
              <select name="assetKind" defaultValue="image" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
                <option value="image">Upload gambar/icon</option>
                <option value="file">Upload file umum</option>
              </select>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                  Unggah gambar atau file
                </span>
                <input
                  name="assetFile"
                  type="file"
                  accept="image/*,.svg,.ico,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip"
                  className="w-full rounded-xl border border-dashed border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-deep hover:border-brand"
                />
                <span className="mt-1 block text-xs text-ink-soft">
                  Opsional. Jika file dipilih, hasil unggahan akan otomatis mengisi kolom isi.
                </span>
              </label>
              <textarea name="description" rows={3} placeholder="Catatan singkat agar mudah dikenali" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand md:col-span-2" />
              <label className="inline-flex items-center gap-3 rounded-[1.25rem] border border-line bg-white/70 px-4 py-3 text-sm text-ink md:col-span-2">
                <input type="checkbox" name="isPublic" defaultChecked className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
                <span>Tampilkan juga untuk halaman publik</span>
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Simpan Pengaturan</button>
              </div>
            </form>
          </AdminModal>
        </div>
      </section>

      {editParameter ? (
        <section className="surface-panel rounded-[2rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-ink">
              Edit {editParameter.label}
            </h3>
            <AdminIconLink
              href={listHref}
              label="Tutup edit pengaturan"
              icon={<CloseIcon />}
              tone="danger"
            />
          </div>
          <form key={editParameter.id} onSubmit={handleUpdate} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={editParameter.id} />
            <input type="hidden" name="existingValue" value={editParameter.value} />
            <input name="label" required defaultValue={editParameter.label} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <input name="key" required defaultValue={editParameter.key} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <input name="groupName" required defaultValue={editParameter.groupName} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <select name="status" defaultValue={editParameter.status} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <textarea name="value" rows={4} defaultValue={editParameter.value} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand md:col-span-2" />
            <select name="assetKind" defaultValue={inferAssetKind(editParameter.key, editParameter.value)} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
              <option value="image">Upload gambar/icon</option>
              <option value="file">Upload file umum</option>
            </select>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Unggah file baru
              </span>
              <input
                name="assetFile"
                type="file"
                accept="image/*,.svg,.ico,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip"
                className="w-full rounded-xl border border-dashed border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-deep hover:border-brand"
              />
              <span className="mt-1 block text-xs text-ink-soft">
                Opsional. Jika diisi, hasil unggahan akan langsung menggantikan isi lama.
              </span>
            </label>
            <textarea name="description" rows={3} defaultValue={editParameter.description} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand md:col-span-2" />
            <label className="inline-flex items-center gap-3 rounded-[1.25rem] border border-line bg-white/70 px-4 py-3 text-sm text-ink md:col-span-2">
              <input type="checkbox" name="isPublic" defaultChecked={editParameter.isPublic} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
              <span>Tampilkan juga untuk halaman publik</span>
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Simpan</button>
              <Link href={listHref} className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70">Batal</Link>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-panel rounded-[2rem] p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="Cari nama, kode, kelompok, atau isi" className="xl:col-span-2 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="group" defaultValue={group} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua kelompok</option>
            {groupOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select name="visibility" defaultValue={visibility} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua visibilitas</option>
            <option value="public">Publik</option>
            <option value="internal">Internal</option>
          </select>
          <select name="status" defaultValue={status} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <input name="dateTo" type="date" defaultValue={dateTo ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="sort" defaultValue={sort} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="newest">Update terbaru</option>
            <option value="oldest">Dibuat terlama</option>
            <option value="label-asc">Nama A-Z</option>
            <option value="label-desc">Nama Z-A</option>
            <option value="key-asc">Kode A-Z</option>
            <option value="group-asc">Kelompok A-Z</option>
          </select>
          <select name="pageSize" defaultValue={String(pageSize)} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            {adminPageSizeOptions.map((option) => (
              <option key={option} value={option}>{option} data</option>
            ))}
          </select>
          <div className="xl:col-span-4 flex gap-2">
            <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Terapkan</button>
            <Link href="/admin/parameter-aplikasi" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70">Reset</Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Pengaturan tidak ditemukan"
          description="Coba longgarkan pencarian atau pilih kelompok yang lebih luas."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Kelompok</th>
                  <th className="px-4 py-3">Isi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((item) => {
                  const rowEditHref = buildAdminPageHref(
                    "/admin/parameter-aplikasi",
                    navParams,
                    { edit: item.id },
                  );

                  return (
                    <tr key={item.id} className={cn("border-t border-line align-top", editParameter?.id === item.id ? "bg-brand-soft/20" : "")}>
                      <td className="px-4 py-3">
                        <div className="min-w-[220px]">
                          <p className="font-semibold text-ink">{item.label}</p>
                          <p className="mt-1 text-xs text-ink-soft">{item.description || "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{item.key}</td>
                      <td className="px-4 py-3"><span className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-ink-soft">{item.groupName}</span></td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[280px] space-y-1">
                          {isImageOrIconValue(item.value) ? (
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">Aset visual</p>
                          ) : null}
                          <p className="leading-6 break-all">{buildValuePreview(item.value)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "active" ? "bg-brand-soft text-brand-deep" : "border border-line text-ink-soft"}`}>{item.status === "active" ? "Aktif" : "Nonaktif"}</span>
                          <p className="text-xs text-ink-soft">{item.isPublic ? "Publik" : "Internal"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[132px] space-y-1">
                          <p>{formatDate(item.updatedAt)}</p>
                          <p className="text-xs text-muted">dibuat {formatDate(item.createdAt)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[104px] flex-wrap gap-2">
                          <AdminIconLink href={rowEditHref} label={`Edit ${item.label}`} icon={<EditIcon />} />
                          <AdminIconButton label={`Hapus ${item.label}`} icon={<TrashIcon />} tone="danger" onClick={() => handleDelete(item)} />
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

export default function AdminAppParametersPage() {
  return (
    <Suspense fallback={null}>
      <AdminAppParametersPageContent />
    </Suspense>
  );
}
