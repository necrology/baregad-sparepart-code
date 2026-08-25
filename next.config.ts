import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

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

function buildUploadRemotePatterns(values: Array<string | undefined>) {
  const patterns: Array<{
    protocol: "http" | "https";
    hostname: string;
    port: string;
    pathname: string;
  }> = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      continue;
    }

    try {
      const url = new URL(trimmedValue);
      const protocol = url.protocol.replace(/:$/, "");

      if (protocol !== "http" && protocol !== "https") {
        continue;
      }

      for (const pathname of ["/api/uploads/**", "/uploads/**"]) {
        const key = `${protocol}//${url.hostname}:${url.port}${pathname}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        patterns.push({
          protocol,
          hostname: url.hostname,
          port: url.port,
          pathname,
        });
      }
    } catch {
      continue;
    }
  }

  return patterns;
}

const configuredBasePath = normalizeBasePath(
  isStaticExport
    ? process.env.NEXT_STATIC_EXPORT_BASE_PATH
    : process.env.NEXT_PUBLIC_BASE_PATH,
);
const uploadRemotePatterns = buildUploadRemotePatterns([
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL,
  process.env.BACKEND_API_BASE_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
]);

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  htmlLimitedBots: /.*/,
  trailingSlash: isStaticExport,
  skipTrailingSlashRedirect: isStaticExport,
  basePath: configuredBasePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: configuredBasePath,
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "true" : "",
  },
  images: {
    unoptimized: isStaticExport,
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hondaserimpi.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      ...uploadRemotePatterns,
    ],
  },
};

export default nextConfig;
