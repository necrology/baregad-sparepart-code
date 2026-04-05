import "server-only";
import type { UserLevel } from "@/entities/user-level/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getAdminUserLevels() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return [] as UserLevel[];
  }

  try {
    return await backendFetchJson<UserLevel[]>("/admin/user-levels", {
      headers,
    });
  } catch {
    return [] as UserLevel[];
  }
}
