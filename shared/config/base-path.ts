const protocolPattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

function normalizeBasePath(value?: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue || trimmedValue === "/") {
    return "";
  }

  const withoutTrailingSlash = trimmedValue.replace(/\/+$/, "");
  return withoutTrailingSlash.startsWith("/")
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
}

const configuredBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
const isStaticExport =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === "true" ||
  process.env.NEXT_STATIC_EXPORT === "true";

function shouldSkipTrailingSlash(value: string) {
  return (
    !value ||
    protocolPattern.test(value) ||
    value.startsWith("//") ||
    value.startsWith("#") ||
    value === "/api" ||
    value.startsWith("/api/")
  );
}

function appendTrailingSlash(value: string) {
  if (!isStaticExport || shouldSkipTrailingSlash(value)) {
    return value;
  }

  const [beforeHash, hash = ""] = value.split("#", 2);
  const [pathname, search = ""] = beforeHash.split("?", 2);

  if (!pathname || pathname === "/" || pathname.endsWith("/")) {
    return value;
  }

  const lastSegment = pathname.split("/").pop() ?? "";

  if (lastSegment.includes(".")) {
    return value;
  }

  const normalizedPathname = `${pathname}/`;
  const nextValue = search
    ? `${normalizedPathname}?${search}`
    : normalizedPathname;

  return hash ? `${nextValue}#${hash}` : nextValue;
}

export function getConfiguredBasePath() {
  return configuredBasePath;
}

export function withBasePath(value: string) {
  if (!value || !configuredBasePath) {
    return value;
  }

  if (
    protocolPattern.test(value) ||
    value.startsWith("//") ||
    value.startsWith("#") ||
    value === "/api" ||
    value.startsWith("/api/")
  ) {
    return value;
  }

  if (
    value === configuredBasePath ||
    value.startsWith(`${configuredBasePath}/`) ||
    value.startsWith(`${configuredBasePath}?`)
  ) {
    return value;
  }

  if (value === "/") {
    return configuredBasePath;
  }

  if (value.startsWith("/")) {
    return `${configuredBasePath}${value}`;
  }

  return value;
}

export function withAppPath(value: string) {
  return appendTrailingSlash(withBasePath(value));
}

export function withoutBasePath(value: string) {
  if (!value || !configuredBasePath) {
    return value;
  }

  if (value === configuredBasePath) {
    return "/";
  }

  if (value.startsWith(`${configuredBasePath}/`)) {
    return value.slice(configuredBasePath.length);
  }

  if (value.startsWith(`${configuredBasePath}?`)) {
    return value.slice(configuredBasePath.length);
  }

  return value;
}
