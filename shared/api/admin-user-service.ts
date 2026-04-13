import type { DashboardUser } from "@/entities/user/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getAdminUsers(token: string | null | undefined) {
  if (!getPublicBackendBaseUrl() || !token?.trim()) {
    return [] as DashboardUser[];
  }

  try {
    return await backendFetchJson<DashboardUser[]>("/admin/users", {
      token,
    });
  } catch {
    return [] as DashboardUser[];
  }
}
