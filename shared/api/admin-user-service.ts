import "server-only";
import type { DashboardUser } from "@/entities/user/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getAdminAuthorizationHeaders } from "@/shared/auth/admin-auth";
import { getBackendRuntimeConfig } from "@/shared/config/env";

export async function getAdminUsers() {
  const config = getBackendRuntimeConfig();
  const headers = await getAdminAuthorizationHeaders();

  if (!config.enabled || !headers) {
    return [] as DashboardUser[];
  }

  try {
    return await backendFetchJson<DashboardUser[]>("/admin/users", {
      headers,
    });
  } catch {
    return [] as DashboardUser[];
  }
}
