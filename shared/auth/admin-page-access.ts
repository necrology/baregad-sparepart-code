"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  adminSessionHasAccess,
  type AdminPageAccessOptions,
} from "@/shared/auth/admin-access";
import { withAppPath, withoutBasePath } from "@/shared/config/base-path";
import { useAdminSession } from "@/shared/runtime/app-runtime-provider";

function buildRelativeUrl(pathname: string, queryString: string) {
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function buildAdminLoginHref(nextPath = "/admin") {
  const targetUrl = new URL("/admin-login", "http://baregad.local");
  const normalizedNextPath = withoutBasePath(nextPath.trim());
  const safeNextPath = normalizedNextPath.startsWith("/")
    ? normalizedNextPath
    : "/admin";

  if (safeNextPath) {
    targetUrl.searchParams.set("next", safeNextPath);
  }

  return buildRelativeUrl(targetUrl.pathname, targetUrl.searchParams.toString());
}

export function useAdminPageAccess(options: AdminPageAccessOptions = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, token, isReady } = useAdminSession();
  const hasSession = !!session && !!token;
  const hasAccess = session ? adminSessionHasAccess(session, options) : false;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const returnTo = buildRelativeUrl(pathname, searchParams.toString());

    if (!hasSession) {
      window.location.replace(withAppPath(buildAdminLoginHref(returnTo)));
      return;
    }

    if (!hasAccess && pathname !== "/admin") {
      window.location.replace(withAppPath("/admin"));
    }
  }, [hasAccess, hasSession, isReady, pathname, searchParams]);

  return {
    session,
    token,
    isReady,
    hasSession,
    hasAccess,
    isAllowed: isReady && hasSession && hasAccess,
  };
}
