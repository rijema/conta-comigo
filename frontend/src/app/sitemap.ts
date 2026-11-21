import type { MetadataRoute } from "next";

// Only public pages. Everything else requires login, and the hidden /dev
// pages must never be listed here (a sitemap is published to search engines).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];
  return ["pt", "en"].map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    changeFrequency: "monthly",
    priority: locale === "pt" ? 1 : 0.8,
    alternates: { languages: { "pt-BR": `${SITE_URL}/pt`, en: `${SITE_URL}/en` } },
  }));
}
