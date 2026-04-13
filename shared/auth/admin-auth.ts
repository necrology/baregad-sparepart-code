export const ADMIN_AUTH_STORAGE_KEY = "baregad_admin_session";

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

export type StoredAdminAuth = {
  token: string;
  expiresAt: string;
  expiresInSeconds: number;
  user: AdminSession;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdminSession(value: unknown): value is AdminSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.username === "string" &&
    typeof value.displayName === "string" &&
    (value.role === "admin" || value.role === "staff") &&
    typeof value.levelId === "string" &&
    typeof value.levelName === "string" &&
    typeof value.levelCode === "string"
  );
}

export function createAdminAuthorizationHeaders(token: string | null | undefined) {
  if (!token?.trim()) {
    return null;
  }

  return {
    Authorization: `Bearer ${token.trim()}`,
  };
}

export function isAdminAuthExpired(expiresAt: string | null | undefined) {
  if (!expiresAt?.trim()) {
    return true;
  }

  const expiresAtTime = Date.parse(expiresAt);
  return !Number.isFinite(expiresAtTime) || expiresAtTime <= Date.now();
}

export function readStoredAdminAuth() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (
      !isRecord(parsed) ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      !Number.isFinite(Number(parsed.expiresInSeconds)) ||
      !isAdminSession(parsed.user)
    ) {
      return null;
    }

    return {
      token: parsed.token,
      expiresAt: parsed.expiresAt,
      expiresInSeconds: Number(parsed.expiresInSeconds),
      user: parsed.user,
    } satisfies StoredAdminAuth;
  } catch {
    return null;
  }
}

export function writeStoredAdminAuth(auth: StoredAdminAuth | AdminLoginResult) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAdminAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
