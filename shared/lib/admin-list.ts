import { buildSearchParams } from "@/shared/lib/query";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export const adminPageSizeOptions = [10, 25, 50] as const;

export function toSearchParamsRecord(searchParams: Iterable<[string, string]>) {
  return Object.fromEntries(Array.from(searchParams)) as SearchParamsRecord;
}

export function readSearchParam(searchParams: SearchParamsRecord | undefined, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function readNumberSearchParam(
  searchParams: SearchParamsRecord | undefined,
  key: string,
  fallback: number,
  options?: readonly number[],
) {
  const rawValue = readSearchParam(searchParams, key);
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  if (options && !options.includes(parsed)) {
    return fallback;
  }

  return parsed;
}

export function buildAdminPageHref(
  pathname: string,
  searchParams: SearchParamsRecord | undefined,
  patch: Record<string, string | number | undefined | null>,
) {
  const current = Object.fromEntries(
    Object.entries(searchParams ?? {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const params = buildSearchParams({
    ...current,
    ...patch,
  });
  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function matchesTextQuery(fields: Array<string | undefined | null>, query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}

export function matchesDateRange(value: string, from?: string, to?: string) {
  const targetTime = new Date(value).getTime();
  if (!Number.isFinite(targetTime)) {
    return false;
  }

  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    if (Number.isFinite(fromTime) && targetTime < fromTime) {
      return false;
    }
  }

  if (to) {
    const toTime = new Date(`${to}T23:59:59.999`).getTime();
    if (Number.isFinite(toTime) && targetTime > toTime) {
      return false;
    }
  }

  return true;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  };
}
