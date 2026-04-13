import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import sharp from "sharp";

const rootDir = process.cwd();
const exportDir = path.join(rootDir, "out");
const outputRootDir = path.join(rootDir, "out-static");
const lockedEnvKeys = new Set(Object.keys(process.env));
const buildTarget = process.argv.includes("--local") ? "local" : "production";
const buildProfiles = {
  local: {
    siteUrl: "http://localhost/baregad-sparepart",
    basePath: "/baregad-sparepart",
  },
  production: {
    siteUrl: "https://baregadsparepart.web.id",
    basePath: "",
  },
};

function getBuildProfile() {
  return buildProfiles[buildTarget] ?? buildProfiles.production;
}

function getOutputDirectory() {
  const normalizedBasePath = getBuildProfile().basePath.replace(/^\/+|\/+$/g, "");

  if (!normalizedBasePath) {
    return outputRootDir;
  }

  return path.join(outputRootDir, ...normalizedBasePath.split("/"));
}

function resolveBuildEnvValue(key, fallbackValue) {
  if (lockedEnvKeys.has(key)) {
    return process.env[key] ?? "";
  }

  return fallbackValue;
}

function applyBuildProfileEnv() {
  const buildProfile = getBuildProfile();

  process.env.NEXT_STATIC_EXPORT = "true";
  process.env.NEXT_PUBLIC_STATIC_EXPORT = "true";
  process.env.NEXT_PUBLIC_SITE_URL = resolveBuildEnvValue(
    "NEXT_PUBLIC_SITE_URL",
    buildProfile.siteUrl,
  );
  process.env.NEXT_STATIC_EXPORT_BASE_PATH = resolveBuildEnvValue(
    "NEXT_STATIC_EXPORT_BASE_PATH",
    buildProfile.basePath,
  );
}

function normalizeBaseUrl(value) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function normalizeParameterKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "-");
}

function resolvePublicAssetUrl(value, apiBaseUrl, siteBaseUrl) {
  if (!value) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) || value.startsWith("//")) {
    return value;
  }

  try {
    const baseUrl =
      value.startsWith("/api/") || value.startsWith("/uploads/")
        ? `${new URL(apiBaseUrl).origin}/`
        : `${normalizeBaseUrl(siteBaseUrl)}/`;

    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function readParameterValue(parameters, key) {
  const parameter = parameters.find(
    (item) => normalizeParameterKey(item?.key) === normalizeParameterKey(key),
  );

  return String(parameter?.value ?? "").trim();
}

function readMetadataBaseUrl(parameters) {
  const parameterValue = readParameterValue(parameters, "metadata-base-url");

  if (parameterValue) {
    return parameterValue;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://baregadsparepart.web.id"
  );
}

async function loadEnvFile(filePath) {
  try {
    const fileContents = await readFile(filePath, "utf8");

    fileContents.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex < 1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();

      if (!key || lockedEnvKeys.has(key)) {
        return;
      }

      let value = trimmedLine.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    });
  } catch {
    // Ignore missing env files so the build can still run with shell-provided vars.
  }
}

async function loadBuildEnv() {
  for (const fileName of [
    ".env",
    ".env.production",
    ".env.local",
    ".env.production.local",
  ]) {
    await loadEnvFile(path.join(rootDir, fileName));
  }
}

function runNextBuild(cwd) {
  const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd,
      env: {
        ...process.env,
      },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Static export build failed with exit code ${code ?? "unknown"}.`));
    });

    child.on("error", reject);
  });
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function replaceOrInsertMetaTag(html, pattern, tag) {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.includes("</head>") ? html.replace("</head>", `${tag}</head>`) : html;
}

function buildFlattenedSegmentAlias(relativePath) {
  const segments = relativePath.split(path.sep);
  const markerIndex = segments.findIndex((segment) => segment.startsWith("__next."));

  if (markerIndex < 0 || markerIndex === segments.length - 1) {
    return null;
  }

  const trailingSegments = segments.slice(markerIndex + 1);

  if (!trailingSegments.at(-1)?.endsWith(".txt")) {
    return null;
  }

  return path.join(
    ...segments.slice(0, markerIndex),
    `${segments[markerIndex]}.${trailingSegments.join(".")}`,
  );
}

async function createFlattenedSegmentAliases(directory) {
  const allFiles = await walkFiles(directory);

  for (const filePath of allFiles) {
    const relativePath = path.relative(directory, filePath);
    const aliasRelativePath = buildFlattenedSegmentAlias(relativePath);

    if (!aliasRelativePath) {
      continue;
    }

    const aliasPath = path.join(directory, aliasRelativePath);

    if (aliasPath === filePath) {
      continue;
    }

    try {
      const existingEntry = await stat(aliasPath);

      if (existingEntry.isFile()) {
        continue;
      }
    } catch {
      await mkdir(path.dirname(aliasPath), { recursive: true });
      await cp(filePath, aliasPath, { force: true });
    }
  }
}

async function fetchPublicAppParameters() {
  const apiBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? process.env.BACKEND_API_BASE_URL,
  );

  if (!apiBaseUrl) {
    return null;
  }

  try {
    const parameterResponse = await fetch(new URL("app-parameters/public", `${apiBaseUrl}/`));

    if (!parameterResponse.ok) {
      return null;
    }

    const parameterPayload = await parameterResponse.json().catch(() => null);
    const parameters = Array.isArray(parameterPayload?.data) ? parameterPayload.data : [];

    return {
      apiBaseUrl,
      siteBaseUrl: normalizeBaseUrl(readMetadataBaseUrl(parameters)),
      parameters,
    };
  } catch {
    return null;
  }
}

async function downloadConfiguredAsset(
  publicConfig,
  key,
  filePattern,
  options = {},
) {
  if (!publicConfig) {
    return null;
  }

  const value = readParameterValue(publicConfig.parameters, key);

  if (!value || !filePattern.test(value)) {
    return null;
  }

  const assetUrl = resolvePublicAssetUrl(
    value,
    publicConfig.apiBaseUrl,
    publicConfig.siteBaseUrl,
  );

  if (!assetUrl) {
    return null;
  }

  try {
    const response = await fetch(assetUrl);

    if (!response.ok) {
      return null;
    }

    const pathname = options.outputPath
      ? options.outputPath
      : new URL(assetUrl).pathname.replace(/^\/+/, "");

    if (!pathname) {
      return null;
    }

    return {
      relativePath: pathname,
      buffer: Buffer.from(await response.arrayBuffer()),
    };
  } catch {
    return null;
  }
}

async function syncConfiguredAsset(directory, asset) {
  if (!asset) {
    return;
  }

  const targetPath = path.join(directory, asset.relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, asset.buffer);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizePreviewText(value, fallback, maxLength) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (!maxLength || normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

async function buildSocialShareImage(publicConfig) {
  if (!publicConfig) {
    return null;
  }

  const logoAsset = await downloadConfiguredAsset(
    publicConfig,
    "logo-url",
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i,
  );

  if (!logoAsset?.buffer?.length) {
    return null;
  }

  const appName =
    normalizePreviewText(
      readParameterValue(publicConfig.parameters, "app-name"),
      "Baregad Sparepart",
      36,
    );
  const categoryLabel =
    normalizePreviewText(
      readParameterValue(publicConfig.parameters, "brand-category-label"),
      "Sparepart Motor",
      48,
    );

  const canvasWidth = 1200;
  const canvasHeight = 630;
  const cardWidth = 980;
  const cardHeight = 410;
  const cardX = Math.round((canvasWidth - cardWidth) / 2);
  const cardY = 110;
  const logoMaxWidth = 640;
  const logoMaxHeight = 220;

  const logoBuffer = await sharp(logoAsset.buffer)
    .resize({
      width: logoMaxWidth,
      height: logoMaxHeight,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoWidth = logoMetadata.width ?? logoMaxWidth;
  const logoLeft = Math.round((canvasWidth - logoWidth) / 2);
  const logoTop = 178;

  const backgroundSvg = `
    <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="72" y1="42" x2="1128" y2="588" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFF7ED"/>
          <stop offset="0.52" stop-color="#FDE7C7"/>
          <stop offset="1" stop-color="#F4C88B"/>
        </linearGradient>
        <linearGradient id="glow" x1="220" y1="120" x2="980" y2="520" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF" stop-opacity="0.88"/>
          <stop offset="1" stop-color="#FFF5E9" stop-opacity="0.65"/>
        </linearGradient>
        <filter id="shadow" x="84" y="66" width="1032" height="462" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#A55A1D" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect width="${canvasWidth}" height="${canvasHeight}" rx="36" fill="url(#bg)"/>
      <circle cx="1060" cy="88" r="168" fill="#FFF9F2" fill-opacity="0.7"/>
      <circle cx="118" cy="568" r="128" fill="#F3B56E" fill-opacity="0.18"/>
      <g filter="url(#shadow)">
        <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="38" fill="url(#glow)"/>
      </g>
      <text x="600" y="430" text-anchor="middle" font-size="58" font-weight="700" fill="#7A3E12" font-family="Arial, Helvetica, sans-serif">${escapeXml(appName)}</text>
      <text x="600" y="486" text-anchor="middle" font-size="24" font-weight="600" fill="#8A572D" font-family="Arial, Helvetica, sans-serif">${escapeXml(categoryLabel)}</text>
    </svg>
  `;

  const shareImageBuffer = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: logoBuffer,
        left: logoLeft,
        top: logoTop,
      },
    ])
    .png()
    .toBuffer();

  return {
    relativePath: "social-share.png",
    buffer: shareImageBuffer,
    width: canvasWidth,
    height: canvasHeight,
    contentType: "image/png",
  };
}

async function syncSocialShareImage(directory) {
  const publicConfig = await fetchPublicAppParameters();
  const socialShareImage = await buildSocialShareImage(publicConfig);

  if (!socialShareImage) {
    return null;
  }

  const targetPath = path.join(directory, socialShareImage.relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, socialShareImage.buffer);

  return {
    ...socialShareImage,
    url: new URL(
      `/${socialShareImage.relativePath}`,
      `${publicConfig.siteBaseUrl}/`,
    ).toString(),
  };
}

async function syncActiveBrandingAssets(directory) {
  const publicConfig = await fetchPublicAppParameters();

  if (!publicConfig) {
    return;
  }

  const faviconAsset = await downloadConfiguredAsset(
    publicConfig,
    "favicon-url",
    /\.ico(\?.*)?$/i,
    {
      outputPath: "favicon.ico",
    },
  );
  const logoAsset = await downloadConfiguredAsset(
    publicConfig,
    "logo-url",
    /\.(png|jpe?g|gif|webp)(\?.*)?$/i,
  );

  await syncConfiguredAsset(directory, faviconAsset);
  await syncConfiguredAsset(directory, logoAsset);
}

function buildShareImageUrl(publicConfig) {
  if (!publicConfig) {
    return null;
  }

  const logoValue = readParameterValue(publicConfig.parameters, "logo-url");
  const fallbackUrl = new URL("/baregad.jpg", `${publicConfig.siteBaseUrl}/`).toString();

  if (!logoValue || !/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(logoValue)) {
    return fallbackUrl;
  }

  return resolvePublicAssetUrl(
    logoValue,
    publicConfig.apiBaseUrl,
    publicConfig.siteBaseUrl,
  ) || fallbackUrl;
}

async function injectSocialPreviewMetadata(directory) {
  const socialShareImage = await syncSocialShareImage(directory);
  const publicConfig = await fetchPublicAppParameters();
  const shareImageUrl = socialShareImage?.url ?? buildShareImageUrl(publicConfig);

  if (!shareImageUrl) {
    return;
  }

  const files = await walkFiles(directory);
  const htmlFiles = files.filter((filePath) => filePath.endsWith(".html"));

  for (const filePath of htmlFiles) {
    const currentHtml = await readFile(filePath, "utf8");
    let nextHtml = replaceOrInsertMetaTag(
      currentHtml,
      /<meta[^>]+property="og:image"[^>]*>/i,
      `<meta property="og:image" content="${shareImageUrl}"/>`,
    );

    if (socialShareImage?.contentType) {
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+property="og:image:type"[^>]*>/i,
        `<meta property="og:image:type" content="${socialShareImage.contentType}"/>`,
      );
    }

    if (socialShareImage?.width && socialShareImage?.height) {
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+property="og:image:width"[^>]*>/i,
        `<meta property="og:image:width" content="${socialShareImage.width}"/>`,
      );
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+property="og:image:height"[^>]*>/i,
        `<meta property="og:image:height" content="${socialShareImage.height}"/>`,
      );
    }

    nextHtml = replaceOrInsertMetaTag(
      nextHtml,
      /<meta[^>]+property="og:image:alt"[^>]*>/i,
      `<meta property="og:image:alt" content="Logo utama ${escapeXml(readParameterValue(publicConfig?.parameters ?? [], "app-name") || "Baregad Sparepart")}"/>`,
    );

    nextHtml = replaceOrInsertMetaTag(
      nextHtml,
      /<meta[^>]+name="twitter:image"[^>]*>/i,
      `<meta name="twitter:image" content="${shareImageUrl}"/>`,
    );

    if (socialShareImage?.contentType) {
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+name="twitter:image:type"[^>]*>/i,
        `<meta name="twitter:image:type" content="${socialShareImage.contentType}"/>`,
      );
    }

    if (socialShareImage?.width && socialShareImage?.height) {
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+name="twitter:image:width"[^>]*>/i,
        `<meta name="twitter:image:width" content="${socialShareImage.width}"/>`,
      );
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+name="twitter:image:height"[^>]*>/i,
        `<meta name="twitter:image:height" content="${socialShareImage.height}"/>`,
      );
      nextHtml = replaceOrInsertMetaTag(
        nextHtml,
        /<meta[^>]+name="twitter:card"[^>]*>/i,
        `<meta name="twitter:card" content="summary_large_image"/>`,
      );
    }

    nextHtml = replaceOrInsertMetaTag(
      nextHtml,
      /<meta[^>]+name="twitter:image:alt"[^>]*>/i,
      `<meta name="twitter:image:alt" content="Logo utama ${escapeXml(readParameterValue(publicConfig?.parameters ?? [], "app-name") || "Baregad Sparepart")}"/>`,
    );

    if (nextHtml !== currentHtml) {
      await writeFile(filePath, nextHtml);
    }
  }
}

async function main() {
  const outputDir = getOutputDirectory();

  await loadBuildEnv();
  applyBuildProfileEnv();
  await rm(exportDir, { recursive: true, force: true });
  await runNextBuild(rootDir);
  await createFlattenedSegmentAliases(exportDir);
  await syncActiveBrandingAssets(exportDir);
  await injectSocialPreviewMetadata(exportDir);
  await rm(outputRootDir, { recursive: true, force: true });
  await mkdir(path.dirname(outputDir), { recursive: true });
  await cp(exportDir, outputDir, { recursive: true, force: true });
  await syncActiveBrandingAssets(outputDir);
  await injectSocialPreviewMetadata(outputDir);
  console.log(
    `Static storefront exported to ${outputDir} for ${getBuildProfile().siteUrl}`,
  );
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
