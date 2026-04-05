import Link from "next/link";
import type { DashboardUser } from "@/entities/user/model/types";
import type { UserLevel } from "@/entities/user-level/model/types";
import { getAdminUsers } from "@/shared/api/admin-user-service";
import { getAdminUserLevels } from "@/shared/api/admin-user-level-service";
import { requireAdminPageAccess } from "@/shared/auth/admin-page-access";
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
import {
  AdminIconButton,
  AdminIconLink,
  AdminIconStatic,
} from "@/shared/ui/admin-icon-action";
import { AdminModal } from "@/shared/ui/admin-modal";
import {
  EditIcon,
  LockIcon,
  TrashIcon,
  WhatsAppIcon,
} from "@/shared/ui/app-icons";

type AdminUsersPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const statusLabelMap = {
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

const userSortOptions = ["newest", "oldest", "name-asc", "name-desc"] as const;

function sortUsers(users: DashboardUser[], sort: string) {
  const sortedUsers = [...users];

  sortedUsers.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "name-asc":
        return left.fullName.localeCompare(right.fullName, "id-ID");
      case "name-desc":
        return right.fullName.localeCompare(left.fullName, "id-ID");
      case "newest":
      default:
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
    }
  });

  return sortedUsers;
}

function createStats(users: DashboardUser[], levels: UserLevel[]) {
  return [
    { label: "Total Akun", value: String(users.length) },
    {
      label: "User Aktif",
      value: String(users.filter((user) => user.status === "active").length),
    },
    {
      label: "Admin WA Aktif",
      value: String(
        users.filter((user) => user.status === "active" && user.isWhatsAppAdmin)
          .length,
      ),
    },
    {
      label: "Level Aktif",
      value: String(levels.filter((level) => level.status === "active").length),
    },
  ];
}

function getRoleLabel(user: DashboardUser) {
  if (user.locked || user.role === "admin") {
    return "Admin Sistem";
  }

  return "Staff";
}

function getRoleBadgeClass(user: DashboardUser) {
  if (user.locked || user.role === "admin") {
    return "bg-accent-soft text-accent";
  }

  return "bg-brand-soft text-brand-deep";
}

function getStatusBadgeClass(status: DashboardUser["status"]) {
  if (status === "active") {
    return "bg-brand-soft text-brand-deep";
  }

  return "border border-line text-ink-soft";
}

function getLevelLabel(user: DashboardUser) {
  if (user.locked || user.role === "admin") {
    return "Admin Sistem";
  }

  return user.levelName || "Belum diatur";
}

function getLevelBadgeClass(user: DashboardUser) {
  if (user.locked || user.role === "admin") {
    return "bg-white text-ink";
  }

  return user.levelName
    ? "border border-line bg-white/80 text-ink-soft"
    : "border border-line bg-white/60 text-muted";
}

function createSelectableLevels(levels: UserLevel[], currentLevelID = "") {
  const levelMap = new Map<string, UserLevel>();

  for (const level of levels) {
    if (level.status === "active" || level.id === currentLevelID) {
      levelMap.set(level.id, level);
    }
  }

  return [...levelMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "id-ID"),
  );
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await requireAdminPageAccess({ allowedRoles: ["admin"] });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [users, levels] = await Promise.all([
    getAdminUsers(),
    getAdminUserLevels(),
  ]);
  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const role = readSearchParam(resolvedSearchParams, "role") ?? "";
  const levelId = readSearchParam(resolvedSearchParams, "levelId") ?? "";
  const waAdmin = readSearchParam(resolvedSearchParams, "waAdmin") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status") ?? "";
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? userSortOptions[0];
  const editUserId = readSearchParam(resolvedSearchParams, "edit") ?? "";

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
  const listHref = buildAdminPageHref("/admin/pengguna", listSearchParams, {});
  const editUser =
    users.find(
      (user) => user.id === editUserId && !user.locked && user.role !== "admin",
    ) ?? null;
  const editReturnHref = editUser
    ? buildAdminPageHref("/admin/pengguna", navigationSearchParams, {
        edit: editUser.id,
      })
    : listHref;
  const selectableCreateLevels = createSelectableLevels(levels);
  const selectableEditLevels = createSelectableLevels(
    levels,
    editUser?.levelId ?? "",
  );

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

      if (role && user.role !== role) {
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

      if (status && user.status !== status) {
        return false;
      }

      return matchesDateRange(user.createdAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredUsers, page, pageSize);
  const stats = createStats(filteredUsers, levels);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          User management
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Kelola akun staff dan level kerjanya
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Setiap user staff sekarang terhubung dengan level user agar pembagian
          kerja lebih rapi. Admin sistem tetap terkunci dan tidak bisa diubah
          dari modul ini, sementara admin WhatsApp bisa dipilih langsung dari
          user staff yang aktif.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              Tambah user baru
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Form insert dipindahkan ke modal supaya area tabel tetap efisien
              dan admin juga bisa menentukan staff mana yang menerima order via
              WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/level-user"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Kelola Level
            </Link>
            <AdminModal
              title="Tambah user baru"
              description="User baru hanya dipakai untuk staff dashboard. Pastikan level user dipilih agar pembagian akun tetap terstruktur, lalu aktifkan admin WhatsApp bila user ini menerima pesanan dari storefront."
              triggerLabel="Tambah User"
              disabled={selectableCreateLevels.length === 0}
            >
              <form
                action="/api/admin-users/create"
                method="post"
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="redirectTo" value={listHref} />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Nama lengkap
                  </span>
                  <input
                    name="fullName"
                    required
                    placeholder="Contoh: Sari Handayani"
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Username
                  </span>
                  <input
                    name="username"
                    required
                    placeholder="contoh.username"
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="nama@baregad.local"
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Telepon
                  </span>
                  <input
                    name="phone"
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Level user
                  </span>
                  <select
                    name="levelId"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
                  >
                    <option value="" disabled>
                      Pilih level user
                    </option>
                    {selectableCreateLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                    Password
                  </span>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    placeholder="Minimal 8 karakter"
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
                <label className="flex items-start gap-3 rounded-[1.2rem] border border-line bg-white/70 p-3 md:col-span-2">
                  <input
                    type="checkbox"
                    name="isWhatsAppAdmin"
                    value="true"
                    className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                      Jadikan admin WhatsApp
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-ink-soft sm:text-sm">
                      User ini akan tampil di storefront sebagai admin WA untuk
                      proses pembelian. Pastikan nomor telepon aktif dan valid.
                    </span>
                  </span>
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
                  >
                    Buat User Baru
                  </button>
                </div>
              </form>
            </AdminModal>
          </div>
        </div>
        {selectableCreateLevels.length === 0 ? (
          <div className="mt-4 rounded-[1.2rem] border border-line bg-white/70 px-4 py-3 text-sm text-ink-soft">
            Belum ada level user aktif. Buat level dulu dari halaman management
            level sebelum menambah user staff baru.
          </div>
        ) : null}
      </section>

      {editUser ? (
        <section className="surface-panel rounded-[2rem] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Edit user staff
              </h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                Ubah data login, level user, status, dan akses admin WA untuk{" "}
                {editUser.fullName}. Kosongkan password bila tidak ingin
                mengganti password saat ini.
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
            action="/api/admin-users/update"
            method="post"
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={editUser.id} />
            <input type="hidden" name="redirectTo" value={editReturnHref} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Nama lengkap
              </span>
              <input
                name="fullName"
                required
                defaultValue={editUser.fullName}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Username
              </span>
              <input
                name="username"
                required
                defaultValue={editUser.username}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Email
              </span>
              <input
                name="email"
                type="email"
                defaultValue={editUser.email}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Telepon
              </span>
              <input
                name="phone"
                defaultValue={editUser.phone}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Level user
              </span>
              <select
                name="levelId"
                required
                defaultValue={editUser.levelId}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              >
                {selectableEditLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Password baru
              </span>
              <input
                name="password"
                type="password"
                minLength={8}
                placeholder="Kosongkan jika tidak diubah"
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
                Status
              </span>
              <select
                name="status"
                defaultValue={editUser.status}
                className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-[1.2rem] border border-line bg-white/70 p-3 md:col-span-2">
              <input
                type="checkbox"
                name="isWhatsAppAdmin"
                value="true"
                defaultChecked={editUser.isWhatsAppAdmin}
                className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
              />
              <span className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  Jadikan admin WhatsApp
                </span>
                <span className="mt-1 block text-xs leading-6 text-ink-soft sm:text-sm">
                  Jika aktif, user ini akan tampil sebagai kontak pemesanan di
                  storefront.
                </span>
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
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Cari nama, username, email, atau telepon
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Contoh: rani, operator.rani, 0812"
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Role
            </span>
            <select
              name="role"
              defaultValue={role}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua role</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Level user
            </span>
            <select
              name="levelId"
              defaultValue={levelId}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua level</option>
              {levels
                .slice()
                .sort((left, right) =>
                  left.name.localeCompare(right.name, "id-ID"),
                )
                .map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Admin WA
            </span>
            <select
              name="waAdmin"
              defaultValue={waAdmin}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua user</option>
              <option value="yes">Admin WA</option>
              <option value="no">Bukan admin WA</option>
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
              <option value="newest">User terbaru</option>
              <option value="oldest">User terlama</option>
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
          <div className="flex flex-wrap items-end gap-2 xl:col-span-5">
            <button
              type="submit"
              className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white"
            >
              Terapkan Filter
            </button>
            <Link
              href="/admin/pengguna"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="User tidak ditemukan"
          description="Coba longgarkan filter nama, role, level, admin WA, status, atau rentang tanggal agar data user yang dicari lebih mudah terlihat."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Admin WA</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3">Update</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((user) => {
                  const editHref = buildAdminPageHref(
                    "/admin/pengguna",
                    navigationSearchParams,
                    { edit: user.id },
                  );

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-t border-line align-top",
                        editUser?.id === user.id ? "bg-brand-soft/20" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-[220px]">
                          <p className="font-semibold text-ink">
                            {user.fullName}
                          </p>
                          <p className="mt-1 text-xs text-ink-soft">
                            @{user.username}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <div className="min-w-[220px] space-y-1">
                          <p>{user.email || "-"}</p>
                          <p>{user.phone || "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user)}`}
                        >
                          {getRoleLabel(user)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[170px]">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClass(user)}`}
                          >
                            {getLevelLabel(user)}
                          </span>
                          {user.levelCode && !user.locked ? (
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                              {user.levelCode}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          {user.isWhatsAppAdmin ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAFBF1] px-3 py-1 text-xs font-semibold text-[#138A4B]">
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                              Admin WA
                            </span>
                          ) : (
                            <span className="text-xs text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(user.status)}`}
                        >
                          {statusLabelMap[user.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {user.locked || user.role === "admin" ? (
                          <AdminIconStatic
                            label="Akun admin sistem terkunci"
                            icon={<LockIcon />}
                          />
                        ) : (
                          <div className="flex min-w-[104px] flex-wrap gap-2">
                            <AdminIconLink
                              href={editHref}
                              label={`Edit ${user.fullName}`}
                              icon={<EditIcon />}
                            />
                            <form
                              action="/api/admin-users/delete"
                              method="post"
                            >
                              <input type="hidden" name="id" value={user.id} />
                              <input
                                type="hidden"
                                name="redirectTo"
                                value={listHref}
                              />
                              <AdminIconButton
                                type="submit"
                                label={`Hapus ${user.fullName}`}
                                icon={<TrashIcon />}
                                tone="danger"
                              />
                            </form>
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
