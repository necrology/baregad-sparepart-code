import { withBasePath } from "@/shared/config/base-path";

const defaultSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://baregadsparepart.web.id";

export type PublicAppConfig = {
  appName: string;
  appShortName: string;
  appDescription: string;
  appTagline: string;
  brandCategoryLabel: string;
  logoUrl: string;
  faviconUrl: string;
  metadataBaseUrl: string;
  seoKeywords: string[];
  adminPanelName: string;
  adminPanelSubtitle: string;
  adminWorkspaceLabel: string;
  adminWorkspaceTitle: string;
  whatsappGreetingLabel: string;
  supportTeamLabel: string;
};

export const defaultPublicAppConfig: PublicAppConfig = {
  appName: "Baregad Sparepart",
  appShortName: "Baregad",
  appDescription:
    "Tempat belanja sparepart motor yang rapi, mudah dicari, dan nyaman dipakai setiap hari.",
  appTagline:
    "Cari sparepart motor lebih cepat dengan tampilan yang jelas dan pilihan barang yang terasa dekat.",
  brandCategoryLabel: "Sparepart Motor",
  logoUrl: withBasePath("/baregad.jpg"),
  faviconUrl: withBasePath("/favicon.ico"),
  metadataBaseUrl: defaultSiteUrl,
  seoKeywords: [
    "sparepart motor",
    "parts motor",
    "toko sparepart motor",
    "jual sparepart motor",
  ],
  adminPanelName: "Baregad Admin",
  adminPanelSubtitle: "Area pengelolaan toko",
  adminWorkspaceLabel: "Ruang admin",
  adminWorkspaceTitle: "Atur toko, katalog, dan pesanan dengan lebih nyaman",
  whatsappGreetingLabel: "admin Baregad",
  supportTeamLabel: "tim Baregad",
};
