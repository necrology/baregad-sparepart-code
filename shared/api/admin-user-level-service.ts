import type { UserLevel } from "@/entities/user-level/model/types";
import { backendFetchJson } from "@/shared/api/backend-client";
import { getPublicBackendBaseUrl } from "@/shared/config/public-env";

export async function getAdminUserLevels(token: string | null | undefined) {
  if (!getPublicBackendBaseUrl() || !token?.trim()) {
    return [] as UserLevel[];
  }

  try {
    return await backendFetchJson<UserLevel[]>("/admin/user-levels", {
      token,
    });
  } catch {
    return [] as UserLevel[];
  }
}
