import "server-only";
import { getBackendRuntimeConfig } from "@/shared/config/env";
import { buildSearchParams, type QueryRecord } from "@/shared/lib/query";

type BackendFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  query?: QueryRecord;
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
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      cache: options.cache ?? "no-store",
      headers: {
        Accept: "application/json",
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        ...options.headers,
      },
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
