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
    "Platform e-commerce sparepart motor dengan storefront customer dan dashboard admin yang siap dihubungkan ke backend API terpisah.",
  appTagline:
    "Belanja sparepart motor lebih cepat, lebih terstruktur, dan siap tumbuh untuk skala enterprise.",
  brandCategoryLabel: "Sparepart Motor",
  logoUrl: "/baregad.jpg",
  faviconUrl: "/favicon.ico",
  metadataBaseUrl: "https://baregad.example",
  seoKeywords: [
    "sparepart motor",
    "parts motor",
    "e-commerce sparepart",
    "dashboard admin sparepart",
  ],
  adminPanelName: "Baregad Admin",
  adminPanelSubtitle: "Panel sparepart motor",
  adminWorkspaceLabel: "Admin workspace",
  adminWorkspaceTitle: "Kelola operasi sparepart lebih terstruktur",
  whatsappGreetingLabel: "admin Baregad",
  supportTeamLabel: "tim Baregad",
};
