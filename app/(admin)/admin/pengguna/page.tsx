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
import type { DashboardUser } from "@/entities/user/model/types";
import type { UserLevel } from "@/entities/user-level/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminUserLevels } from "@/shared/api/admin-user-level-service";
import { getAdminUsers } from "@/shared/api/admin-user-service";
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
import {
  AdminIconButton,
  AdminIconLink,
  AdminIconStatic,
} from "@/shared/ui/admin-icon-action";
import { AdminModal } from "@/shared/ui/admin-modal";
import {
  CloseIcon,
  EditIcon,
  LockIcon,
  TrashIcon,
  WhatsAppIcon,
} from "@/shared/ui/app-icons";

const statusLabelMap = {
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

function sortUsers(users: DashboardUser[], sort: string) {
  const sorted = [...users];

  sorted.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case "name-asc":
        return left.fullName.localeCompare(right.fullName, "id-ID");
      case "name-desc":
        return right.fullName.localeCompare(left.fullName, "id-ID");
      case "newest":
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });

  return sorted;
}

function createSelectableLevels(levels: UserLevel[], currentLevelId = "") {
  const levelMap = new Map<string, UserLevel>();

  for (const level of levels) {
    if (level.status === "active" || level.id === currentLevelId) {
      levelMap.set(level.id, level);
    }
  }

  return [...levelMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "id-ID"),
  );
}

function getRoleLabel(user: DashboardUser) {
  return user.locked || user.role === "admin" ? "Admin Utama" : "Staff";
}

function getRoleBadgeClass(user: DashboardUser) {
  return user.locked || user.role === "admin"
    ? "bg-accent-soft text-accent"
    : "bg-brand-soft text-brand-deep";
}

function getStatusBadgeClass(status: DashboardUser["status"]) {
  return status === "active"
    ? "bg-brand-soft text-brand-deep"
    : "border border-line text-ink-soft";
}

function getLevelLabel(user: DashboardUser) {
  if (user.locked || user.role === "admin") {
    return "Admin Utama";
  }

  return user.levelName || "Belum diatur";
}

function AdminUsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAllowed, isReady } = useAdminPageAccess({
    allowedRoles: ["admin"],
  });
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [busyState, setBusyState] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const paramsRecord = toSearchParamsRecord(searchParams.entries());

  const loadData = useCallback(async () => {
    if (!token?.trim()) {
      return;
    }

    const [nextUsers, nextLevels] = await Promise.all([
      getAdminUsers(token),
      getAdminUserLevels(token),
    ]);

    setUsers(nextUsers);
    setLevels(nextLevels);
  }, [token]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadData]);

  if (!isReady || !isAllowed) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan daftar akun...
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
  const status = readSearchParam(paramsRecord, "status") ?? "";
  const levelId = readSearchParam(paramsRecord, "levelId") ?? "";
  const waAdmin = readSearchParam(paramsRecord, "waAdmin") ?? "";
  const dateFrom = readSearchParam(paramsRecord, "dateFrom");
  const dateTo = readSearchParam(paramsRecord, "dateTo");
  const sort = readSearchParam(paramsRecord, "sort") ?? "newest";
  const editUserId = readSearchParam(paramsRecord, "edit") ?? "";

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
  const listHref = buildAdminPageHref("/admin/pengguna", listParams, {});
  const editUser =
    users.find(
      (user) => user.id === editUserId && !user.locked && user.role !== "admin",
    ) ?? null;
  const editHref = editUser
    ? buildAdminPageHref("/admin/pengguna", navParams, { edit: editUser.id })
    : listHref;
  const createLevels = createSelectableLevels(levels);
  const editLevels = createSelectableLevels(levels, editUser?.levelId ?? "");

  async function handleMutation(
    pathname: string,
    method: "POST" | "PUT" | "DELETE",
    payload?: unknown,
    successMessage = "Perubahan berhasil disimpan.",
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
        title: "Memproses akun",
        description: "Mohon tunggu sebentar.",
      },
    );

    try {
      await backendFetchJson(pathname, {
        method,
        token,
        json: payload,
      });
      await loadData();
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
              : "Data akun belum bisa diproses.",
          tone: "error",
        }),
      );
      return false;
    } finally {
      setBusyState(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const didCreate = await handleMutation(
      "/admin/users",
      "POST",
      {
        fullName: String(formData.get("fullName") ?? ""),
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        levelId: String(formData.get("levelId") ?? ""),
        password: String(formData.get("password") ?? ""),
        status: String(formData.get("status") ?? "active"),
        isWhatsAppAdmin: formData.get("isWhatsAppAdmin") === "true",
      },
      "Akun berhasil ditambahkan.",
      listHref,
      {
        title: "Menyimpan akun",
        description: "Sedang menyimpan akun baru untuk tim toko.",
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
      `/admin/users/${id}`,
      "PUT",
      {
        fullName: String(formData.get("fullName") ?? ""),
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        levelId: String(formData.get("levelId") ?? ""),
        password: String(formData.get("password") ?? ""),
        status: String(formData.get("status") ?? "active"),
        isWhatsAppAdmin: formData.get("isWhatsAppAdmin") === "true",
      },
      "Perubahan akun berhasil disimpan.",
      editHref,
      {
        title: "Menyimpan perubahan akun",
        description: "Sedang menyimpan perubahan data akun.",
      },
    );
  }

  async function handleDelete(user: DashboardUser) {
    const confirmed = window.confirm(`Hapus akun "${user.fullName}"?`);

    if (!confirmed) {
      return;
    }

    await handleMutation(
      `/admin/users/${user.id}`,
      "DELETE",
      undefined,
      "Akun berhasil dihapus.",
      listHref,
      {
        title: "Menghapus akun",
        description: "Sedang menghapus akun yang dipilih.",
      },
    );
  }

  const filteredUsers = sortUsers(
    users.filter((user) => {
      if (
        !matchesTextQuery(
          [user.fullName, user.username, user.email, user.phone],
          q,
        )
      ) {
        return false;
      }

      if (status && user.status !== status) {
        return false;
      }

      if (levelId && user.levelId !== levelId) {
        return false;
      }

      if (waAdmin === "yes" && !user.isWhatsAppAdmin) {
        return false;
      }

      if (waAdmin === "no" && user.isWhatsAppAdmin) {
        return false;
      }

      return matchesDateRange(user.createdAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredUsers, page, pageSize);

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
              Akun tim
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Kelola akun tim toko
            </h2>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/level-user"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Hak Akses
            </Link>
            <AdminModal
              title="Tambah Akun"
              description="Akun baru dipakai untuk tim toko dan kontak WhatsApp."
              triggerLabel="Tambah Akun"
              disabled={createLevels.length === 0}
            >
              <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
                <input name="fullName" required placeholder="Nama lengkap" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
                <input name="username" required placeholder="Username" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
                <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
                <input name="phone" placeholder="Telepon" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
                <select name="levelId" required defaultValue="" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
                  <option value="" disabled>Pilih hak akses</option>
                  {createLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
                <input name="password" type="password" minLength={8} required placeholder="Password" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
                <select name="status" defaultValue="active" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                <label className="flex items-center gap-3 rounded-[1.2rem] border border-line bg-white/70 p-3 md:col-span-2">
                  <input type="checkbox" name="isWhatsAppAdmin" value="true" className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
                  <span className="flex items-center gap-2 text-sm text-ink"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Jadikan admin WhatsApp</span>
                </label>
                <div className="md:col-span-2">
                  <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Simpan Akun</button>
                </div>
              </form>
            </AdminModal>
          </div>
        </div>
      </section>

      {editUser ? (
        <section className="surface-panel rounded-[2rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Edit {editUser.fullName}
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                Kosongkan password jika tidak ingin menggantinya.
              </p>
            </div>
            <AdminIconLink
              href={listHref}
              label="Tutup edit akun"
              icon={<CloseIcon />}
              tone="danger"
            />
          </div>
          <form key={editUser.id} onSubmit={handleUpdate} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={editUser.id} />
            <input name="fullName" required defaultValue={editUser.fullName} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <input name="username" required defaultValue={editUser.username} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <input name="email" type="email" defaultValue={editUser.email} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <input name="phone" defaultValue={editUser.phone} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <select name="levelId" required defaultValue={editUser.levelId} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
              {editLevels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
            <input name="password" type="password" minLength={8} placeholder="Password baru" className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
            <select name="status" defaultValue={editUser.status} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <label className="flex items-center gap-3 rounded-[1.2rem] border border-line bg-white/70 p-3 md:col-span-2">
              <input type="checkbox" name="isWhatsAppAdmin" value="true" defaultChecked={editUser.isWhatsAppAdmin} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
              <span className="flex items-center gap-2 text-sm text-ink"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Jadikan admin WhatsApp</span>
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Simpan</button>
              <Link href={listHref} className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70">Batal</Link>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-panel rounded-[2rem] p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input name="q" defaultValue={q} placeholder="Cari nama, username, email, telepon" className="xl:col-span-2 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="levelId" defaultValue={levelId} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua hak akses</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
          <select name="waAdmin" defaultValue={waAdmin} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua akun</option>
            <option value="yes">Admin WA</option>
            <option value="no">Bukan admin WA</option>
          </select>
          <select name="status" defaultValue={status} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <input name="dateTo" type="date" defaultValue={dateTo ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="sort" defaultValue={sort} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
          </select>
          <select name="pageSize" defaultValue={String(pageSize)} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            {adminPageSizeOptions.map((option) => (
              <option key={option} value={option}>{option} data</option>
            ))}
          </select>
          <div className="xl:col-span-5 flex gap-2">
            <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Terapkan</button>
            <Link href="/admin/pengguna" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70">Reset</Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Akun tidak ditemukan"
          description="Coba longgarkan filter pencarian atau status."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Akun</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Hak Akses</th>
                  <th className="px-4 py-3">WA</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((user) => {
                  const rowEditHref = buildAdminPageHref(
                    "/admin/pengguna",
                    navParams,
                    { edit: user.id },
                  );

                  return (
                    <tr key={user.id} className={cn("border-t border-line align-top", editUser?.id === user.id ? "bg-brand-soft/20" : "")}>
                      <td className="px-4 py-3">
                        <div className="min-w-[220px]">
                          <p className="font-semibold text-ink">{user.fullName}</p>
                          <p className="mt-1 text-xs text-ink-soft">@{user.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[220px] space-y-1">
                          <p>{user.email || "-"}</p>
                          <p>{user.phone || "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user)}`}>{getRoleLabel(user)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[170px]">
                          <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold text-ink-soft">
                            {getLevelLabel(user)}
                          </span>
                          {user.levelCode && !user.locked ? (
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{user.levelCode}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.isWhatsAppAdmin ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#EAFBF1] px-3 py-1 text-xs font-semibold text-[#138A4B]">
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                            Admin WA
                          </span>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(user.status)}`}>{statusLabelMap[user.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        {user.locked || user.role === "admin" ? (
                          <AdminIconStatic label="Akun admin utama tidak bisa diubah" icon={<LockIcon />} />
                        ) : (
                          <div className="flex min-w-[104px] flex-wrap gap-2">
                            <AdminIconLink href={rowEditHref} label={`Edit ${user.fullName}`} icon={<EditIcon />} />
                            <AdminIconButton label={`Hapus ${user.fullName}`} icon={<TrashIcon />} tone="danger" onClick={() => handleDelete(user)} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableShell>

          <AdminTablePagination
            pathname="/admin/pengguna"
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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersPageContent />
    </Suspense>
  );
}
