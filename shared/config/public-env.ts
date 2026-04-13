const normalizeBaseUrl = (value?: string) =>
  value?.trim().replace(/\/+$/, "") ?? "";

export function getPublicBackendBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL);
}
