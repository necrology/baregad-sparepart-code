import { withBasePath } from "@/shared/config/base-path";

export function buildSafeAdminRedirectUrl(
  request: Request,
  pathname: string,
  redirectTo: FormDataEntryValue | null,
  patch: Record<string, string | undefined>,
) {
  const requestUrl = new URL(request.url);
  const resolvedPathname = withBasePath(pathname);
  let targetUrl = new URL(resolvedPathname, requestUrl);

  if (typeof redirectTo === "string" && redirectTo.trim()) {
    try {
      const candidateUrl = new URL(redirectTo, requestUrl);

      if (
        candidateUrl.origin === requestUrl.origin &&
        (candidateUrl.pathname === pathname ||
          candidateUrl.pathname === resolvedPathname)
      ) {
        targetUrl.search = candidateUrl.search;
      }
    } catch {
      targetUrl = new URL(resolvedPathname, requestUrl);
    }
  }

  for (const [key, value] of Object.entries(patch)) {
    if (!value) {
      targetUrl.searchParams.delete(key);
      continue;
    }

    targetUrl.searchParams.set(key, value);
  }

  return targetUrl;
}
