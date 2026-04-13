"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAdminPageAccess } from "@/shared/auth/admin-page-access";
import { useBranding } from "@/shared/runtime/app-runtime-provider";
import { Container } from "@/shared/ui/container";
import { AdminShell } from "@/widgets/admin/admin-shell";

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { branding } = useBranding();
  const { session, isAllowed, isReady } = useAdminPageAccess();

  if (!isReady) {
    return (
      <Container className="py-10">
        <div className="surface-panel rounded-[1.8rem] p-6 text-sm text-ink-soft">
          Memeriksa sesi admin...
        </div>
      </Container>
    );
  }

  if (!isAllowed || !session) {
    return null;
  }

  return (
    <AdminShell key={pathname} session={session} branding={branding}>
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
