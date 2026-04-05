export function buildSafeAdminRedirectUrl(
  request: Request,
  pathname: string,
  redirectTo: FormDataEntryValue | null,
  patch: Record<string, string | undefined>,
) {
  const requestUrl = new URL(request.url);
  let targetUrl = new URL(pathname, requestUrl);

  if (typeof redirectTo === "string" && redirectTo.trim()) {
    try {
      const candidateUrl = new URL(redirectTo, requestUrl);

      if (candidateUrl.origin === requestUrl.origin && candidateUrl.pathname === pathname) {
        targetUrl = candidateUrl;
      }
    } catch {
      targetUrl = new URL(pathname, requestUrl);
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
