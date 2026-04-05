import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const staticBasePath = process.env.NEXT_STATIC_EXPORT_BASE_PATH?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  trailingSlash: isStaticExport,
  skipTrailingSlashRedirect: isStaticExport,
  basePath: isStaticExport && staticBasePath ? staticBasePath : undefined,
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
