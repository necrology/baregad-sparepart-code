import "server-only";
import { cookies } from "next/headers";
import { BackendRequestError, backendFetchJson } from "@/shared/api/backend-client";

export const ADMIN_AUTH_COOKIE = "baregad_admin_session";

export type AdminSession = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "staff";
  levelId: string;
  levelName: string;
  levelCode: string;
};

export type AdminLoginResult = {
  token: string;
  expiresAt: string;
  expiresInSeconds: number;
  user: AdminSession;
};

export async function getAdminAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value?.trim() || null;
}

export async function getAdminAuthorizationHeaders() {
  const token = await getAdminAccessToken();

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getAdminSession() {
  const headers = await getAdminAuthorizationHeaders();

  if (!headers) {
    return null;
  }

  try {
    return await backendFetchJson<AdminSession>("/admin/auth/me", {
      headers,
    });
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      return null;
    }

    return null;
  }
}
