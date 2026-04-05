import type { AdminSession } from "@/shared/auth/admin-auth";

type AllowedAdminRole = AdminSession["role"];

export type AdminPageAccessOptions = {
  allowedRoles?: AllowedAdminRole[];
  allowedLevelCodes?: string[];
};

function normalizeLevelCode(value: string) {
  return value.trim().toLowerCase();
}

export function adminSessionHasAccess(
  session: AdminSession,
  {
    allowedRoles = ["admin", "staff"],
    allowedLevelCodes = [],
  }: AdminPageAccessOptions = {},
) {
  if (allowedRoles.includes(session.role)) {
    return true;
  }

  const normalizedLevelCode = normalizeLevelCode(session.levelCode);
  return allowedLevelCodes.some((levelCode) => normalizeLevelCode(levelCode) === normalizedLevelCode);
}
