import type { MetadataRoute } from "next";

const SITE = "https://mavrix.agency";

/** Allow everything, keep the app host's private routes out, point to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
