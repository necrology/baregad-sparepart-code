"use client";

import { Suspense } from "react";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import { useBranding } from "@/shared/runtime/app-runtime-provider";
import { AppLoadingCard } from "@/shared/ui/app-loading";
import { AdminShell } from "@/widgets/admin/admin-shell";

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { branding } = useBranding();
  const { session, isAllowed, isReady } = useAdminPageAccess();

  if (!isReady) {
    return (
      <div className="py-6">
        <AppLoadingCard
          title="Memeriksa sesi admin"
          description="Akses dan hak login Anda sedang divalidasi sebelum dashboard ditampilkan."
        />
      </div>
    );
  }

  if (!isAllowed || !session) {
    return null;
  }

  return (
    <AdminShell session={session} branding={branding}>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
