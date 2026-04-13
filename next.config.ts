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

const configuredBasePath = normalizeBasePath(
  isStaticExport
    ? process.env.NEXT_STATIC_EXPORT_BASE_PATH
    : process.env.NEXT_PUBLIC_BASE_PATH,
);

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  trailingSlash: isStaticExport,
  skipTrailingSlashRedirect: isStaticExport,
  basePath: configuredBasePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: configuredBasePath,
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "true" : "",
  },
  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hondaserimpi.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
