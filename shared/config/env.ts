import "server-only";

const normalizeBaseUrl = (value?: string) =>
  value?.trim().replace(/\/+$/, "") ?? "";

export function getBackendRuntimeConfig() {
  const baseUrl = normalizeBaseUrl(process.env.BACKEND_API_BASE_URL);
  const rawTimeout = Number(process.env.BACKEND_API_TIMEOUT_MS ?? "8000");

  return {
    baseUrl,
    enabled: baseUrl.length > 0,
    timeoutMs: Number.isFinite(rawTimeout) ? rawTimeout : 8000,
    token: process.env.BACKEND_API_TOKEN?.trim() || undefined,
  };
}
