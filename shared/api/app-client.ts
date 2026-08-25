import { withBasePath } from "@/shared/config/base-path";
import { buildSearchParams, type QueryRecord } from "@/shared/lib/query";
import { dispatchNetworkActivity } from "@/shared/runtime/network-activity";

type AppFetchOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  formData?: FormData;
  query?: QueryRecord;
  trackActivity?: boolean;
};

export class AppRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AppRequestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function appFetchJson<T>(
  pathname: string,
  options: AppFetchOptions = {},
) {
  const params = buildSearchParams(options.query ?? {});
  const resolvedPathname = withBasePath(pathname);
  const requestUrl = params.size
    ? `${resolvedPathname}${resolvedPathname.includes("?") ? "&" : "?"}${params.toString()}`
    : resolvedPathname;
  const {
    json,
    formData,
    trackActivity = true,
    headers,
    ...requestInit
  } = options;
  const hasJsonBody = json !== undefined;
  const hasFormDataBody = formData instanceof FormData;

  if (hasJsonBody && hasFormDataBody) {
    throw new Error("App request cannot send json and formData together.");
  }

  const shouldTrackActivity = typeof window !== "undefined" && trackActivity;

  if (shouldTrackActivity) {
    dispatchNetworkActivity(1);
  }

  try {
    const response = await fetch(requestUrl, {
      ...requestInit,
      headers: {
        Accept: "application/json",
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasJsonBody
        ? JSON.stringify(json)
        : hasFormDataBody
          ? formData
          : undefined,
    });

    const payload =
      response.status === 204 ? null : ((await response.json().catch(() => null)) as unknown);

    if (!response.ok) {
      throw new AppRequestError(
        isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}.`,
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
    if (shouldTrackActivity) {
      dispatchNetworkActivity(-1);
    }
  }
}
