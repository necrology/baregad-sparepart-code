import type { AppParameter } from "@/entities/app-parameter/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getAdminAppParameters(token: string | null | undefined) {
  if (!getPublicBackendBaseUrl() || !token?.trim()) {
    return [] as AppParameter[];
  }

  try {
    return await backendFetchJson<AppParameter[]>("/admin/app-parameters", {
      token,
    });
  } catch {
    return [] as AppParameter[];
  }
}
