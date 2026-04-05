import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { requireAdminPageAccess } from "@/shared/auth/admin-page-access";
import { AdminShell } from "@/widgets/admin/admin-shell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, branding] = await Promise.all([
    requireAdminPageAccess(),
    getPublicAppConfig(),
  ]);

  return <AdminShell session={session} branding={branding}>{children}</AdminShell>;
}
