import { Suspense } from "react";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { getPublicAppConfig } from "@/shared/api/public-app-config-service";
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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicAppConfig();

  return {
    metadataBase: new URL(config.metadataBaseUrl),
    title: {
      default: config.appName,
      template: `%s | ${config.appName}`,
    },
    description: config.appDescription,
    keywords: config.seoKeywords,
    icons: {
      icon: config.faviconUrl,
      shortcut: config.faviconUrl,
      apple: config.faviconUrl,
    },
    openGraph: {
      title: config.appName,
      description: config.appDescription,
      type: "website",
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
        <div className="page-grid fixed inset-0 -z-20 opacity-50" />
        <div className="page-glow fixed inset-x-0 top-0 -z-10 h-[32rem]" />
        <Suspense fallback={null}>
          <AppToastViewport />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
