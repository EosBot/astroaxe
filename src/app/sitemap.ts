import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return ["/", "/acervo-cultural", "/metodologia", "/privacidade"].map((pathname) => ({
    url: new URL(pathname, siteUrl).href,
    changeFrequency: pathname === "/" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : 0.7,
  }));
}
