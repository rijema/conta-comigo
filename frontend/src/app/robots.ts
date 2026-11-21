import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

// Hidden pages are not listed here on purpose: a Disallow line would reveal
// their address. They are kept out of search results by the X-Robots-Tag
// header set in next.config.js and by their noindex metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ...(SITE_URL ? { sitemap: `${SITE_URL}/sitemap.xml` } : {}),
  };
}
