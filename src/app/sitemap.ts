import type { MetadataRoute } from "next";
import { getAllArticles, CATEGORIES } from "@/content/resources";
import { PRODUCTS } from "./(marketing)/_components/products";

const SITE = "https://mavrix.agency";

/**
 * Full sitemap for the marketing site. The Resources library is enumerated from
 * the content layer, so every article Mavrix publishes appears automatically
 * (with its own lastModified) the moment it is in the corpus / DB.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/how-it-works`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/resources`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/legal/ai-disclosure`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE}${p.path}`, changeFrequency: "monthly", priority: 0.6,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE}/resources/${c.slug}`, changeFrequency: "weekly", priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE}/resources/${a.category}/${a.slug}`,
    lastModified: a.dateModified,
    changeFrequency: "monthly",
    priority: a.featured ? 0.8 : 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...articlePages];
}
