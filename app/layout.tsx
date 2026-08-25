import { access } from "node:fs/promises";
import { join } from "node:path";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/app/providers";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
import { defaultPublicAppConfig } from "@/shared/config/app";
import { AppToastViewport } from "@/shared/ui/app-toast-viewport";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

function isSameOriginPublicAsset(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/api/") &&
    !value.startsWith("/uploads/")
  );
}

async function publicAssetExists(value: string) {
  try {
    const [pathname] = value.split(/[?#]/, 1);
    await access(join(process.cwd(), "public", pathname.replace(/^\/+/, "")));
    return true;
  } catch {
    return false;
  }
}

async function remoteAssetExists(value: string, metadataBaseUrl: string) {
  try {
    const targetUrl = new URL(value, metadataBaseUrl);
    const response = await fetch(targetUrl, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
    });

    if (response.ok) {
      return true;
    }

    if (response.status !== 405) {
      return false;
    }

    const fallbackResponse = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    return fallbackResponse.ok;
  } catch {
    return false;
  }
}

async function resolveMetadataIcon(
  preferredValue: string,
  metadataBaseUrl: string,
  fallbackValue = defaultPublicAppConfig.faviconUrl,
) {
  const candidates = [preferredValue, fallbackValue];

  for (const candidate of candidates) {
    const trimmedCandidate = candidate.trim();

    if (!trimmedCandidate) {
      continue;
    }

    if (isSameOriginPublicAsset(trimmedCandidate)) {
      if (await publicAssetExists(trimmedCandidate)) {
        return trimmedCandidate;
      }

      continue;
    }

    if (await remoteAssetExists(trimmedCandidate, metadataBaseUrl)) {
      return trimmedCandidate;
    }
  }

  return fallbackValue;
}

export async function generateMetadata(): Promise<Metadata> {
  const appConfig = await getPublicAppConfig();
  const faviconUrl = await resolveMetadataIcon(
    appConfig.faviconUrl,
    appConfig.metadataBaseUrl,
  );

  return {
    metadataBase: new URL(appConfig.metadataBaseUrl),
    title: {
      default: appConfig.appName,
      template: `%s | ${appConfig.appName}`,
    },
    description: appConfig.appDescription,
    keywords: appConfig.seoKeywords,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: appConfig.appName,
      description: appConfig.appDescription,
      type: "website",
      url: appConfig.metadataBaseUrl,
      siteName: appConfig.appName,
    },
    twitter: {
      card: "summary_large_image",
      title: appConfig.appName,
      description: appConfig.appDescription,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-canvas text-ink" suppressHydrationWarning>
        <AppProviders>
          <div className="page-grid fixed inset-0 -z-20 opacity-50" />
          <div className="page-glow fixed inset-x-0 top-0 -z-10 h-[32rem]" />
          <Suspense fallback={null}>
            <AppToastViewport />
          </Suspense>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
