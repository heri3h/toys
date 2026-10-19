export interface AdSlotConfig {
  id: string;
  name: string;
  slotPath: string; // e.g. /22282810983/lw5wflkevg_xqc_home_top
  sizes: number[][]; // e.g. [[300, 250], [336, 280]]
  tcpm: string; // e.g. "125000"
  enabled: boolean;
  lazyLoad: boolean;
}

export interface SiteSettings {
  siteName: string;
  domainUrl: string;
  gaMeasurementId: string; // e.g. G-TZ7MNVNL43
  googleAdsId: string; // e.g. AW-16468268201
  googleAdsConversionLabel: string; // e.g. kt1RCNLmgpUZEKmp16w9
  enableAdTrafficOverlay: boolean; // Spinner overlay when ?gclid= is present
  overlayTimeoutSeconds: number; // e.g. 3
  mobileAutoScrollToTopAd: boolean;
  truncateOnAdTrafficOnly: boolean; // Truncate & Read More only for ad traffic
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  metaDescription: string;
  ogImage: string;
  category: string;
  readingTime: string;
  publishedDate: string;
  author: string;
  content: string; // HTML or Markdown formatted content
}

export interface SiteData {
  settings: SiteSettings;
  ads: {
    sidebarLeft: AdSlotConfig;
    sidebarRight: AdSlotConfig;
    homeTop: AdSlotConfig;
    homeMore: AdSlotConfig;
    inArticle: AdSlotConfig;
    interstitial: AdSlotConfig;
  };
  articles: Article[];
}
