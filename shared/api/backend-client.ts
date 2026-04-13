import { getPublicBackendBaseUrl } from "@/shared/config/public-env";
import { buildSearchParams, type QueryRecord } from "@/shared/lib/query";

type BackendFetchOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  formData?: FormData;
  query?: QueryRecord;
  token?: string | null;
  timeoutMs?: number;
};

export class BackendRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function getBackendRuntimeConfig() {
  const baseUrl =
    getPublicBackendBaseUrl() ||
    normalizeBaseUrl(process.env.BACKEND_API_BASE_URL);
  const rawTimeout = Number(
    process.env.NEXT_PUBLIC_BACKEND_API_TIMEOUT_MS ??
      process.env.BACKEND_API_TIMEOUT_MS ??
      "8000",
  );

  return {
    baseUrl,
    enabled: baseUrl.length > 0,
    timeoutMs: Number.isFinite(rawTimeout) ? rawTimeout : 8000,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function backendFetchJson<T>(
  pathname: string,
  options: BackendFetchOptions = {},
) {
  const config = getBackendRuntimeConfig();

  if (!config.enabled) {
    throw new Error("BACKEND_API_BASE_URL is not configured.");
  }

  const url = new URL(pathname.replace(/^\/+/, ""), `${config.baseUrl}/`);
  const params = buildSearchParams(options.query ?? {});

  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? config.timeoutMs,
  );
  const {
    json,
    formData,
    token,
    headers,
    ...requestInit
  } = options;
  const hasJsonBody = json !== undefined;
  const hasFormDataBody = formData instanceof FormData;

  if (hasJsonBody && hasFormDataBody) {
    throw new Error("Backend request cannot send json and formData together.");
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      cache: requestInit.cache ?? "no-store",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasJsonBody ? JSON.stringify(json) : hasFormDataBody ? formData : undefined,
      signal: controller.signal,
    });

    const payload =
      response.status === 204 ? null : ((await response.json().catch(() => null)) as unknown);

    if (!response.ok) {
      throw new BackendRequestError(
        isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : `Backend request failed with status ${response.status}.`,
        response.status,
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    if (isRecord(payload) && "data" in payload) {
      return payload.data as T;
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}
