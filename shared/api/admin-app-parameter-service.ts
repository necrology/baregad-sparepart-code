import "server-only";
import type { AppParameter } from "@/entities/app-parameter/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getAdminAppParameters() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return [] as AppParameter[];
  }

  try {
    return await backendFetchJson<AppParameter[]>("/admin/app-parameters", {
      headers,
    });
  } catch {
    return [] as AppParameter[];
  }
}
