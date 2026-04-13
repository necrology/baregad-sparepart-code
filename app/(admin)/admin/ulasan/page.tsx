"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductReview } from "@/entities/product-review/model/types";
import { buildProductHref } from "@/entities/product/model/product-links";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminProductReviews } from "@/shared/api/admin-product-review-service";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import {
  adminPageSizeOptions,
  matchesDateRange,
  matchesTextQuery,
  paginateItems,
  readNumberSearchParam,
  readSearchParam,
  toSearchParamsRecord,
} from "@/shared/lib/admin-list";
import { buildToastHref } from "@/shared/lib/toast";
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

const statusLabelMap = {
  pending: "Menunggu cek",
  approved: "Tayang",
  rejected: "Ditolak",
  hidden: "Disembunyikan",
} as const;

function sortReviews(items: ProductReview[], sort: string) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    switch (sort) {
      case "oldest":
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case "rating-high":
        return right.rating - left.rating;
      case "rating-low":
        return left.rating - right.rating;
      case "newest":
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });

  return sorted;
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

function AdminProductReviewsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAllowed, isReady } = useAdminPageAccess({
    allowedRoles: ["admin"],
    allowedLevelCodes: ["admin", "admin-baregad"],
  });
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const paramsRecord = toSearchParamsRecord(searchParams.entries());

  const loadReviews = useCallback(async () => {
    if (!token?.trim()) {
      return;
    }

    setReviews(await getAdminProductReviews(token));
  }, [token]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadReviews();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [isAllowed, loadReviews]);

  async function handleAction(
    pathname: string,
    method: "PUT" | "DELETE",
    payload: unknown,
    successMessage: string,
  ) {
    if (!token?.trim()) {
      router.replace(
        buildToastHref("/admin/ulasan", {
          message: "Sesi login tidak ditemukan.",
          tone: "error",
        }),
      );
      return;
    }

    try {
      await backendFetchJson(pathname, {
        method,
        token,
        json: payload,
      });
      await loadReviews();
      router.replace(buildToastHref("/admin/ulasan", { message: successMessage, tone: "success" }));
    } catch (error) {
      router.replace(
        buildToastHref("/admin/ulasan", {
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Perubahan ulasan belum bisa disimpan.",
          tone: "error",
        }),
      );
    }
  }

  if (!isReady || !isAllowed) {
    return (
      <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
        Sedang menyiapkan daftar ulasan...
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
  const rating = readSearchParam(paramsRecord, "rating") ?? "";
  const dateFrom = readSearchParam(paramsRecord, "dateFrom");
  const dateTo = readSearchParam(paramsRecord, "dateTo");
  const sort = readSearchParam(paramsRecord, "sort") ?? "newest";

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

  const pagination = paginateItems(filteredReviews, page, pageSize);

  return (
    <div className="space-y-4">
      <section className="surface-panel rounded-[2rem] p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Ulasan
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Atur ulasan yang tampil di halaman produk
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft sm:text-base">
          Pilih ulasan yang layak ditampilkan supaya calon pembeli mendapat
          gambaran yang jelas sebelum membeli.
        </p>
      </section>

      <section className="surface-panel rounded-[2rem] p-4">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="Cari produk, nama pengulas, email, atau komentar" className="xl:col-span-2 w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="status" defaultValue={status} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua status</option>
            <option value="pending">Menunggu cek</option>
            <option value="approved">Tayang</option>
            <option value="hidden">Disembunyikan</option>
            <option value="rejected">Ditolak</option>
          </select>
          <select name="rating" defaultValue={rating} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="">Semua rating</option>
            <option value="5">5/5</option>
            <option value="4">4/5</option>
            <option value="3">3/5</option>
            <option value="2">2/5</option>
            <option value="1">1/5</option>
          </select>
          <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <input name="dateTo" type="date" defaultValue={dateTo ?? ""} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand" />
          <select name="sort" defaultValue={sort} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="rating-high">Rating tinggi</option>
            <option value="rating-low">Rating rendah</option>
          </select>
          <select name="pageSize" defaultValue={String(pageSize)} className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand">
            {adminPageSizeOptions.map((option) => (
              <option key={option} value={option}>{option} data</option>
            ))}
          </select>
          <div className="xl:col-span-4 flex gap-2">
            <button type="submit" className="rounded-full border border-brand-deep bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep hover:text-white focus-visible:text-white">Terapkan</button>
            <Link href="/admin/ulasan" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70">Reset</Link>
          </div>
        </form>
      </section>

      {pagination.items.length === 0 ? (
        <AdminTableEmptyState
          title="Ulasan tidak ditemukan"
          description="Coba longgarkan filter pencarian atau status."
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
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((review) => (
                  <tr key={review.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <div className="min-w-[220px]">
                        <Link href={buildProductHref(review.productSlug)} className="font-semibold text-ink transition hover:text-brand">
                          {review.productName}
                        </Link>
                        <p className="mt-1 text-xs text-ink-soft">/{review.productSlug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="min-w-[180px]">
                        <p className="font-semibold text-ink">{review.customerName}</p>
                        <p className="mt-1 text-xs">{review.customerEmail || "-"}</p>
                        <p className="mt-1 text-xs">{formatDate(review.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RatingStars value={review.rating} size="sm" valueLabel={`${review.rating}/5`} />
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="min-w-[320px] space-y-2">
                        <p className="leading-6">{review.comment}</p>
                        {review.adminNote ? (
                          <p className="rounded-[1rem] border border-line bg-white/70 px-3 py-2 text-xs">
                            Catatan admin: {review.adminNote}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(review.status)}`}>
                        {statusLabelMap[review.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[164px] flex-wrap gap-2">
                        {review.status !== "approved" ? (
                          <AdminIconButton label="Tayangkan" icon={<CheckIcon />} tone="success" onClick={() => handleAction(`/admin/product-reviews/${review.id}/moderate`, "PUT", { status: "approved", adminNote: review.adminNote ?? "" }, "Ulasan ditayangkan.")} />
                        ) : null}
                        {review.status !== "hidden" ? (
                          <AdminIconButton label="Sembunyikan" icon={<EyeOffIcon />} tone="warning" onClick={() => handleAction(`/admin/product-reviews/${review.id}/moderate`, "PUT", { status: "hidden", adminNote: review.adminNote ?? "" }, "Ulasan disembunyikan.")} />
                        ) : null}
                        {review.status !== "rejected" ? (
                          <AdminIconButton label="Tolak" icon={<CloseIcon />} tone="muted" onClick={() => handleAction(`/admin/product-reviews/${review.id}/moderate`, "PUT", { status: "rejected", adminNote: review.adminNote ?? "" }, "Ulasan ditolak.")} />
                        ) : null}
                        <AdminIconButton label="Hapus" icon={<TrashIcon />} tone="danger" onClick={() => handleAction(`/admin/product-reviews/${review.id}`, "DELETE", undefined, "Ulasan dihapus.")} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>

          <AdminTablePagination
            pathname="/admin/ulasan"
            searchParams={paramsRecord}
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

export default function AdminProductReviewsPage() {
  return (
    <Suspense fallback={null}>
      <AdminProductReviewsPageContent />
    </Suspense>
  );
}
