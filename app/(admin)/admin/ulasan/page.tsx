import Image from "next/image";
import Link from "next/link";
import type { ProductReview } from "@/entities/product-review/model/types";
import { DEFAULT_PRODUCT_IMAGE } from "@/entities/product/model/product-images";
import { getAdminProductReviews } from "@/shared/api/admin-product-review-service";
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
import { formatDate } from "@/shared/lib/date";
import {
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableShell,
} from "@/shared/ui/admin-table";
import { AdminIconButton } from "@/shared/ui/admin-icon-action";
import {
  CheckIcon,
  CloseIcon,
  EyeOffIcon,
  TrashIcon,
} from "@/shared/ui/app-icons";
import { RatingStars } from "@/shared/ui/rating-stars";

type AdminProductReviewsPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const reviewSortOptions = [
  "newest",
  "oldest",
  "rating-high",
  "rating-low",
] as const;

const statusLabelMap = {
  pending: "Pending",
  approved: "Tayang",
  rejected: "Ditolak",
  hidden: "Disembunyikan",
} as const;

function sortReviews(items: ProductReview[], sort: string) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "rating-high":
        return (
          right.rating - left.rating ||
          new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
        );
      case "rating-low":
        return (
          left.rating - right.rating ||
          new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
        );
      case "newest":
      default:
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
    }
  });

  return sorted;
}

function createStats(items: ProductReview[]) {
  return [
    { label: "Total Review", value: String(items.length) },
    {
      label: "Menunggu Moderasi",
      value: String(items.filter((item) => item.status === "pending").length),
    },
    {
      label: "Tayang di Store",
      value: String(items.filter((item) => item.status === "approved").length),
    },
  ];
}

function getStatusBadgeClass(status: ProductReview["status"]) {
  switch (status) {
    case "approved":
      return "bg-brand-soft text-brand-deep";
    case "pending":
      return "bg-accent-soft text-accent";
    case "rejected":
      return "border border-line bg-white/70 text-ink-soft";
    case "hidden":
    default:
      return "border border-line bg-white/60 text-muted";
  }
}

export default async function AdminProductReviewsPage({
  searchParams,
}: AdminProductReviewsPageProps) {
  await requireAdminPageAccess({
    allowedRoles: ["admin"],
    allowedLevelCodes: ["admin", "admin-baregad"],
  });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const reviews = await getAdminProductReviews();
  const page = readNumberSearchParam(resolvedSearchParams, "page", 1);
  const pageSize = readNumberSearchParam(
    resolvedSearchParams,
    "pageSize",
    adminPageSizeOptions[0],
    adminPageSizeOptions,
  );
  const q = readSearchParam(resolvedSearchParams, "q") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status") ?? "";
  const rating = readSearchParam(resolvedSearchParams, "rating") ?? "";
  const dateFrom = readSearchParam(resolvedSearchParams, "dateFrom");
  const dateTo = readSearchParam(resolvedSearchParams, "dateTo");
  const sort =
    readSearchParam(resolvedSearchParams, "sort") ?? reviewSortOptions[0];

  const navigationSearchParams: SearchParamsRecord = {
    ...(resolvedSearchParams ?? {}),
    toast: undefined,
    toastType: undefined,
    success: undefined,
    error: undefined,
  };
  const listHref = buildAdminPageHref(
    "/admin/ulasan",
    navigationSearchParams,
    {},
  );

  const filteredReviews = sortReviews(
    reviews.filter((review) => {
      if (
        !matchesTextQuery(
          [
            review.productName,
            review.productSlug,
            review.customerName,
            review.customerEmail,
            review.comment,
            review.adminNote,
          ],
          q,
        )
      ) {
        return false;
      }

      if (status && review.status !== status) {
        return false;
      }

      if (rating && review.rating !== Number(rating)) {
        return false;
      }

      return matchesDateRange(review.createdAt, dateFrom, dateTo);
    }),
    sort,
  );

  const stats = createStats(filteredReviews);
  const pagination = paginateItems(filteredReviews, page, pageSize);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Product review management
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Moderasi rating dan komentar produk
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Semua review dari storefront masuk ke halaman ini agar admin bisa
          menyeleksi komentar yang layak tayang, menyembunyikan konten yang
          meragukan, atau menghapus data yang tidak diinginkan.
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
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Cari produk, nama pengulas, email, atau komentar
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Contoh: nissin, dimas, terang, komentar"
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
              <option value="pending">Pending</option>
              <option value="approved">Tayang</option>
              <option value="hidden">Disembunyikan</option>
              <option value="rejected">Ditolak</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">
              Rating
            </span>
            <select
              name="rating"
              defaultValue={rating}
              className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            >
              <option value="">Semua rating</option>
              <option value="5">5/5</option>
              <option value="4">4/5</option>
              <option value="3">3/5</option>
              <option value="2">2/5</option>
              <option value="1">1/5</option>
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
              <option value="newest">Review terbaru</option>
              <option value="oldest">Review terlama</option>
              <option value="rating-high">Rating tertinggi</option>
              <option value="rating-low">Rating terendah</option>
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
              href="/admin/ulasan"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Review produk tidak ditemukan"
          description="Coba longgarkan filter pencarian, status, rating, atau rentang tanggal agar review yang dicari lebih mudah terlihat."
        />
      ) : (
        <>
          <AdminTableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Pengulas</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Komentar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((review) => (
                  <tr
                    key={review.id}
                    className="border-t border-line align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-[240px] items-start gap-3">
                        <Image
                          src={review.productImage || DEFAULT_PRODUCT_IMAGE}
                          alt={review.productName}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-[1rem] border border-line object-cover"
                        />
                        <div>
                          <Link
                            href={`/produk/${review.productSlug}`}
                            className="font-semibold text-ink transition hover:text-brand"
                          >
                            {review.productName}
                          </Link>
                          <p className="mt-1 text-xs text-ink-soft">
                            /{review.productSlug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="min-w-[200px]">
                        <p className="font-semibold text-ink">
                          {review.customerName}
                        </p>
                        <p className="mt-1 text-xs">
                          {review.customerEmail || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[132px]">
                        <RatingStars
                          value={review.rating}
                          size="sm"
                          valueLabel={`${review.rating}/5`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="min-w-[320px] max-w-[420px] space-y-2">
                        <p className="leading-6">{review.comment}</p>
                        {review.adminNote ? (
                          <p className="rounded-[1rem] border border-line bg-white/70 px-3 py-2 text-xs leading-5 text-ink-soft">
                            Catatan admin: {review.adminNote}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(review.status)}`}
                      >
                        {statusLabelMap[review.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="min-w-[130px] space-y-1">
                        <p>{formatDate(review.createdAt)}</p>
                        {review.moderatedAt ? (
                          <p className="text-xs">
                            Moderasi: {formatDate(review.moderatedAt)}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[164px] flex-wrap gap-2">
                        {review.status !== "approved" ? (
                          <form
                            action="/api/admin-product-reviews/moderate"
                            method="post"
                          >
                            <input type="hidden" name="id" value={review.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="approved"
                            />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={listHref}
                            />
                            <AdminIconButton
                              type="submit"
                              label={`Tayangkan review ${review.customerName}`}
                              icon={<CheckIcon />}
                              tone="success"
                            />
                          </form>
                        ) : null}
                        {review.status !== "hidden" ? (
                          <form
                            action="/api/admin-product-reviews/moderate"
                            method="post"
                          >
                            <input type="hidden" name="id" value={review.id} />
                            <input type="hidden" name="status" value="hidden" />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={listHref}
                            />
                            <AdminIconButton
                              type="submit"
                              label={`Sembunyikan review ${review.customerName}`}
                              icon={<EyeOffIcon />}
                              tone="warning"
                            />
                          </form>
                        ) : null}
                        {review.status !== "rejected" ? (
                          <form
                            action="/api/admin-product-reviews/moderate"
                            method="post"
                          >
                            <input type="hidden" name="id" value={review.id} />
                            <input
                              type="hidden"
                              name="status"
                              value="rejected"
                            />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={listHref}
                            />
                            <AdminIconButton
                              type="submit"
                              label={`Tolak review ${review.customerName}`}
                              icon={<CloseIcon />}
                              tone="muted"
                            />
                          </form>
                        ) : null}
                        <form
                          action="/api/admin-product-reviews/delete"
                          method="post"
                        >
                          <input type="hidden" name="id" value={review.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={listHref}
                          />
                          <AdminIconButton
                            type="submit"
                            label={`Hapus review ${review.customerName}`}
                            icon={<TrashIcon />}
                            tone="danger"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>

          <AdminTablePagination
            pathname="/admin/ulasan"
            searchParams={navigationSearchParams}
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
