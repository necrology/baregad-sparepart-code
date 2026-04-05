export type QueryRecord = Record<
  string,
  string | number | boolean | undefined | null | Array<string | number>
>;

export function buildSearchParams(query: QueryRecord) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
      return;
    }

    params.set(key, String(value));
  });

  return params;
}
