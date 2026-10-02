import type { MetadataRoute } from "next";

// Open to search and AI crawlers (including training crawlers): being known
// to the models is the point. Only the API and one-off flows are off limits.
export default function robots(): MetadataRoute.Robots {
  const site = (process.env.SITE_URL || "https://garrettsmith.com").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
