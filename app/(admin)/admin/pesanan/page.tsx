import Link from "next/link";
import type { Order, OrderStatus } from "@/entities/order/model/types";
import { getAdminOrders } from "@/shared/api/admin-order-service";
import { requireAdminPageAccess } from "@/shared/auth/admin-page-access";
import {
  adminPageSizeOptions,
  matchesDateRange,
  matchesTextQuery,
  paginateItems,
  readNumberSearchParam,
  readSearchParam,
  type SearchParamsRecord,
} from "@/shared/lib/admin-list";
import { formatRupiah } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/date";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";

type AdminOrdersPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const orderStatusOptions: OrderStatus[] = [
  "Baru",
  "Diproses",
  "Siap Kirim",
  "Selesai",
];
const orderSortOptions = [
  "newest",
  "oldest",
  "total-desc",
  "total-asc",
] as const;

function sortOrders(orders: Order[], sort: string) {
  const sortedOrders = [...orders];

  sortedOrders.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "total-desc":
        return right.total - left.total;
      case "total-asc":
        return left.total - right.total;
      case "newest":
      default:
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
    }
  });

  return sortedOrders;
}

function getStatusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "Selesai":
      return "bg-brand-soft text-brand-deep";
    case "Siap Kirim":
      return "bg-accent-soft text-accent";
    case "Diproses":
      return "border border-line text-ink-soft";
    case "Baru":
    default:
      return "bg-white text-ink";
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  await requireAdminPageAccess({ allowedRoles: ["admin"] });
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status") ?? "";
  const vehicle = readSearchParam(resolvedSearchParams, "vehicle") ?? "";
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? orderSortOptions[0];
  const orders = await getAdminOrders();

  const filteredOrders = sortOrders(
    orders.filter((order) => {
      if (!matchesTextQuery([order.id, order.customerName, order.vehicle], q)) {
        return false;
      }

      if (status && order.status !== status) {
        return false;
      }

      if (vehicle && order.vehicle !== vehicle) {
        return false;
      }

      return matchesDateRange(order.createdAt, dateFrom, dateTo);
    }),
    sort,
  );

  const pagination = paginateItems(filteredOrders, page, pageSize);
  const vehicleOptions = [
    ...new Set(orders.map((order) => order.vehicle)),
  ].sort();
  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const stats = [
    { label: "Total Pesanan", value: String(filteredOrders.length) },
    {
      label: "Perlu Diproses",
      value: String(
        filteredOrders.filter((order) => order.status === "Baru").length,
      ),
    },
    {
      label: "Siap Kirim",
      value: String(
        filteredOrders.filter((order) => order.status === "Siap Kirim").length,
      ),
    },
    { label: "Nilai Pesanan", value: formatRupiah(totalRevenue) },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Order management
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Pantau antrean pesanan dengan lebih cepat
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Semua pesanan dirapikan dalam tabel yang lebih ringkas supaya tim bisa
          scan status, nilai order, dan detail customer tanpa perlu membuka
          kartu yang terlalu besar.
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
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Cari ID pesanan, nama customer, atau tipe motor
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Contoh: ORD-2405, Andi Prasetyo, Vario 160"
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
              {orderStatusOptions.map((option) => (
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
              {vehicleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Tanggal dari
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
              Tanggal sampai
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
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="total-desc">Nilai tertinggi</option>
              <option value="total-asc">Nilai terendah</option>
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
              href="/admin/pesanan"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Pesanan tidak ditemukan"
          description="Coba longgarkan filter status, tanggal, atau kata kunci agar data pesanan yang dicari lebih mudah muncul."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Pesanan</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Motor</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((order) => (
                  <tr key={order.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <div className="min-w-[170px]">
                        <p className="font-semibold text-ink">{order.id}</p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="min-w-[180px] font-semibold text-ink">
                        {order.customerName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{order.vehicle}</td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {order.itemCount}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>

          <AdminTablePagination
            pathname="/admin/pesanan"
            searchParams={resolvedSearchParams}
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
