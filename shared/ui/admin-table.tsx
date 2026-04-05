import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import {
  buildAdminPageHref,
  type SearchParamsRecord,
} from "@/shared/lib/admin-list";

type TableShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminTableShell({ children, className }: TableShellProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[1.6rem] border border-line bg-white/75",
        className,
      )}
    >
      {children}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
};

export function AdminTableEmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="surface-panel rounded-[1.8rem] p-4">
      <h3 className="font-display text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
        {description}
      </p>
    </div>
  );
}

type PaginationProps = {
  pathname: string;
  searchParams?: SearchParamsRecord;
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
};

export function AdminTablePagination({
  pathname,
  searchParams,
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const pageItems = createPageItems(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border border-line bg-white/75 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-soft">
        Menampilkan {startIndex + 1}-{endIndex} dari {totalItems} data
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildAdminPageHref(pathname, searchParams, {
            page: Math.max(1, page - 1),
          })}
          aria-disabled={page <= 1}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold transition",
            page <= 1
              ? "pointer-events-none border border-line bg-white/60 text-muted"
              : "border border-line bg-white text-ink hover:bg-brand-soft hover:text-brand-deep",
          )}
        >
          Sebelumnya
        </Link>
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <Link
              key={item}
              href={buildAdminPageHref(pathname, searchParams, { page: item })}
              className={cn(
                "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition",
                item === page
                  ? "bg-brand text-white"
                  : "border border-line bg-white text-ink hover:bg-brand-soft hover:text-brand-deep",
              )}
            >
              {item}
            </Link>
          ) : (
            <span
              key={item}
              className="inline-flex h-10 min-w-10 items-center justify-center px-2 text-sm font-semibold text-muted"
            >
              ...
            </span>
          ),
        )}
        <Link
          href={buildAdminPageHref(pathname, searchParams, {
            page: Math.min(totalPages, page + 1),
          })}
          aria-disabled={page >= totalPages}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold transition",
            page >= totalPages
              ? "pointer-events-none border border-line bg-white/60 text-muted"
              : "border border-line bg-white text-ink hover:bg-brand-soft hover:text-brand-deep",
          )}
        >
          Berikutnya
        </Link>
      </div>
    </div>
  );
}

function createPageItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  const items: Array<number | string> = [1];

  if (start > 2) {
    items.push("left-ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (end < totalPages - 1) {
    items.push("right-ellipsis");
  }

  items.push(totalPages);

  return items;
}
