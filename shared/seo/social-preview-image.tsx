import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { defaultPublicAppConfig } from "@/shared/config/app";

export const socialPreviewAlt =
  "Logo Baregad Sparepart";

export const socialPreviewSize = {
  width: 1200,
  height: 630,
} as const;

export const socialPreviewContentType = "image/png";

type SocialPreviewBranding = {
  appName: string;
  appShortName: string;
  metadataBaseUrl: string;
  logoUrl: string;
};

function createInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getImageMimeType(pathname: string) {
  const normalizedPathname = pathname.toLowerCase();

  if (normalizedPathname.endsWith(".jpg") || normalizedPathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedPathname.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalizedPathname.endsWith(".gif")) {
    return "image/gif";
  }

  return "image/png";
}

async function readPublicAssetAsDataUri(value: string) {
  const [pathname] = value.split(/[?#]/, 1);

  if (
    !pathname ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/")
  ) {
    return null;
  }

  const assetPath = join(process.cwd(), "public", pathname.replace(/^\/+/, ""));

  try {
    await access(assetPath);
    const assetBuffer = await readFile(assetPath);
    const mimeType = getImageMimeType(pathname);
    return `data:${mimeType};base64,${assetBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function buildAbsoluteAssetUrl(value: string, metadataBaseUrl: string) {
  try {
    return new URL(value, metadataBaseUrl).toString();
  } catch {
    return null;
  }
}

async function loadBranding(): Promise<SocialPreviewBranding> {
  const appConfig = await getPublicAppConfig();

  return {
    appName: appConfig.appName || defaultPublicAppConfig.appName,
    appShortName: appConfig.appShortName || defaultPublicAppConfig.appShortName,
    metadataBaseUrl:
      appConfig.metadataBaseUrl || defaultPublicAppConfig.metadataBaseUrl,
    logoUrl: appConfig.logoUrl || defaultPublicAppConfig.logoUrl,
  };
}

async function resolveLogoSrc(branding: SocialPreviewBranding) {
  return (
    (await readPublicAssetAsDataUri(branding.logoUrl)) ??
    buildAbsoluteAssetUrl(branding.logoUrl, branding.metadataBaseUrl) ??
    (await readPublicAssetAsDataUri(defaultPublicAppConfig.logoUrl)) ??
    buildAbsoluteAssetUrl(
      defaultPublicAppConfig.logoUrl,
      branding.metadataBaseUrl,
    )
  );
}

function renderLogo(branding: SocialPreviewBranding, logoSrc: string | null) {
  const initials = createInitials(branding.appShortName || branding.appName);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 360,
        height: 360,
        padding: 36,
        borderRadius: 72,
        overflow: "hidden",
        border: "1px solid rgba(77, 135, 187, 0.26)",
        background: "linear-gradient(180deg, #aee5ff 0%, #87ceeb 100%)",
        boxShadow:
          "0 40px 90px rgba(38, 74, 112, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.58)",
      }}
    >
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={`${branding.appName} logo`}
          width="288"
          height="288"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: "#2d679c",
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: "-0.05em",
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function createVisualAccent(style: {
  inset?: string;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  width: number;
  height: number;
  background: string;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: 9999,
        filter: "blur(4px)",
        ...style,
      }}
    />
  );
}

export async function createSocialPreviewImageResponse() {
  const branding = await loadBranding();
  const logoSrc = await resolveLogoSrc(branding);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: 40,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, #f8fcff 0%, #eef7ff 44%, #e6f2fb 100%)",
          color: "#213a55",
        }}
      >
        {createVisualAccent({
          top: -120,
          left: -80,
          width: 360,
          height: 360,
          background: "rgba(112, 180, 222, 0.22)",
        })}
        {createVisualAccent({
          top: -60,
          right: -40,
          width: 320,
          height: 320,
          background: "rgba(77, 135, 187, 0.18)",
        })}
        {createVisualAccent({
          bottom: -120,
          right: 140,
          width: 360,
          height: 360,
          background: "rgba(45, 103, 156, 0.12)",
        })}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.34,
            backgroundImage:
              "linear-gradient(rgba(63, 111, 158, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 111, 158, 0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            borderRadius: 44,
            border: "1px solid rgba(70, 121, 171, 0.16)",
            background: "rgba(255, 255, 255, 0.8)",
          }}
        >
          {renderLogo(branding, logoSrc)}
        </div>
      </div>
    ),
    {
      ...socialPreviewSize,
    },
  );
}
