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

function isSocialPreviewImage(value: string | null | undefined) {
  const normalizedValue = value?.trim().toLowerCase() ?? "";

  if (!normalizedValue) {
    return false;
  }

  return /\.(png|jpe?g|gif|webp)(\?.*)?$/.test(normalizedValue);
}

export async function generateMetadata(): Promise<Metadata> {
  const appConfig = await getPublicAppConfig();
  const shareImage = isSocialPreviewImage(appConfig.logoUrl)
    ? appConfig.logoUrl
    : defaultPublicAppConfig.logoUrl;

  return {
    metadataBase: new URL(appConfig.metadataBaseUrl),
    title: {
      default: appConfig.appName,
      template: `%s | ${appConfig.appName}`,
    },
    description: appConfig.appDescription,
    keywords: appConfig.seoKeywords,
    icons: {
      icon: appConfig.faviconUrl,
      shortcut: appConfig.faviconUrl,
      apple: appConfig.faviconUrl,
    },
    openGraph: {
      title: appConfig.appName,
      description: appConfig.appDescription,
      type: "website",
      url: appConfig.metadataBaseUrl,
      siteName: appConfig.appName,
      images: [
        {
          url: shareImage,
          alt: appConfig.appName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: appConfig.appName,
      description: appConfig.appDescription,
      images: [shareImage],
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
