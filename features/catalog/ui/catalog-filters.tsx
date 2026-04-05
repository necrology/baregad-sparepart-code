"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  CatalogOptionSet,
  CatalogQuery,
  CatalogSort,
} from "@/entities/product/model/types";
import { buildSearchParams } from "@/shared/lib/query";

type CatalogFiltersProps = {
  options: CatalogOptionSet;
  applied: CatalogQuery;
  total: number;
};

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "popular", label: "Terlaris" },
  { value: "latest", label: "Terbaru" },
  { value: "promo", label: "Promo" },
  { value: "price-asc", label: "Harga termurah" },
  { value: "price-desc", label: "Harga tertinggi" },
];

function createTargetUrl(
  pathname: string,
  applied: CatalogQuery,
  patch: Partial<CatalogQuery>,
) {
  const nextQuery = {
    ...applied,
    ...patch,
  } satisfies CatalogQuery;

  const params = buildSearchParams({
    q: nextQuery.q?.trim() || undefined,
    category: nextQuery.category,
    brand: nextQuery.brand,
    vehicle: nextQuery.vehicle,
    motorCode: nextQuery.motorCode,
    availability: nextQuery.availability,
    sort: nextQuery.sort !== "popular" ? nextQuery.sort : undefined,
    minPrice: nextQuery.minPrice,
    maxPrice: nextQuery.maxPrice,
  });

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function CatalogFilters({ options, applied, total }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState(() => applied.q ?? "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredKeyword = useDeferredValue(keyword);

  function navigateWithPatch(patch: Partial<CatalogQuery>) {
    const target = createTargetUrl(pathname, applied, patch);

    startTransition(() => {
      router.replace(target, { scroll: false });
    });
  }

  useEffect(() => {
    const normalizedKeyword = deferredKeyword.trim();

    if (normalizedKeyword === (applied.q ?? "")) {
      return;
    }

    const target = createTargetUrl(pathname, applied, {
      q: normalizedKeyword || undefined,
    });

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    }, 240);

    return () => window.clearTimeout(timer);
  }, [applied, deferredKeyword, pathname, router, startTransition]);

  const filterPanel = (
    <div className="surface-panel rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">
            Filter produk
          </p>
          <p className="mt-1.5 text-xs text-ink-soft sm:text-sm">
            {total} item cocok dengan filter aktif.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white/70"
          onClick={() => {
            setKeyword("");
            navigateWithPatch({
              q: undefined,
              category: undefined,
              brand: undefined,
              vehicle: undefined,
              motorCode: undefined,
              availability: undefined,
              sort: "popular",
              minPrice: undefined,
              maxPrice: undefined,
            });
          }}
        >
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">Cari sparepart</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Contoh: busi, kampas rem, aki"
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">Kategori</span>
          <select
            value={applied.category ?? ""}
            onChange={(event) =>
              navigateWithPatch({ category: event.target.value || undefined })
            }
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua kategori</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">Brand</span>
          <select
            value={applied.brand ?? ""}
            onChange={(event) =>
              navigateWithPatch({ brand: event.target.value || undefined })
            }
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua brand</option>
            {options.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">Tipe motor</span>
          <select
            value={applied.vehicle ?? ""}
            onChange={(event) =>
              navigateWithPatch({ vehicle: event.target.value || undefined })
            }
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua tipe motor</option>
            {options.vehicles.map((vehicle) => (
              <option key={vehicle} value={vehicle}>
                {vehicle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink sm:text-sm">Kode motor</span>
          <select
            value={applied.motorCode ?? ""}
            onChange={(event) =>
              navigateWithPatch({ motorCode: event.target.value || undefined })
            }
            className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Semua kode motor</option>
            {options.motorCodes.map((motorCode) => (
              <option key={motorCode} value={motorCode}>
                {motorCode}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2.5">
          <input
            checked={applied.availability === "ready"}
            type="checkbox"
            onChange={(event) =>
              navigateWithPatch({
                availability: event.target.checked ? "ready" : undefined,
              })
            }
            className="h-4 w-4 rounded border-line"
          />
          <span className="text-xs font-semibold text-ink sm:text-sm">Hanya tampilkan stok siap</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="surface-panel rounded-[1.5rem] p-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">
              Sortir katalog
            </p>
            <p className="mt-1.5 text-xs text-ink-soft sm:text-sm">
              {isPending ? "Memperbarui katalog..." : "URL sinkron dengan filter aktif."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => navigateWithPatch({ sort: option.value })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  applied.sort === option.value
                    ? "bg-brand text-white hover:text-white focus-visible:text-white"
                    : "border border-line bg-white/75 text-ink-soft hover:bg-brand-soft hover:text-brand-deep"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((value) => !value)}
          className="w-full rounded-[1.2rem] border border-line bg-white/75 px-3 py-2.5 text-left text-xs font-semibold text-ink sm:text-sm"
        >
          {isMobileOpen ? "Tutup filter" : "Buka filter"}
        </button>
        {isMobileOpen ? <div className="mt-3">{filterPanel}</div> : null}
      </div>

      <div className="hidden lg:block">{filterPanel}</div>
    </div>
  );
}
