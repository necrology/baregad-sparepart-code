import "server-only";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/shared/auth/admin-auth";
import {
  adminSessionHasAccess,
  type AdminPageAccessOptions,
} from "@/shared/auth/admin-access";

export async function requireAdminPageAccess(
  options: AdminPageAccessOptions = {},
) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin-login");
  }

  if (!adminSessionHasAccess(session, options)) {
    redirect("/admin");
  }

  return session;
}
