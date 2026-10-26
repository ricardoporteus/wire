/**
 * The query API for the Resources hub. Every route, component and the sitemap
 * read the library through these functions, never the raw array. To move the
 * corpus into the Neon/Drizzle DB (where Mavrix will write it), reimplement
 * these against the DB and make them async — call sites already `await` them.
 */
import { ALL_ARTICLES } from "./articles";
import { CATEGORIES, CATEGORY_BY_SLUG } from "./meta";
import type { Article, ArticleCard, CategorySlug } from "./types";

export * from "./types";
export { CATEGORIES, CATEGORY_BY_SLUG, TYPE_LABEL, AUTHORS } from "./meta";

/** Newest first, used everywhere the order is not otherwise specified. */
const byDateDesc = (a: Article, b: Article) =>
  b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug);

const toCard = (a: Article): ArticleCard => ({
  slug: a.slug,
  category: a.category,
  type: a.type,
  title: a.title,
  excerpt: a.excerpt,
  author: a.author,
  datePublished: a.datePublished,
  readingMinutes: a.readingMinutes,
  featured: a.featured,
  pillar: a.pillar,
});

/** The single feature piece for the hub hero. Falls back to the newest article. */
export async function getFeatured(): Promise<Article> {
  return ALL_ARTICLES.find((a) => a.featured) ?? [...ALL_ARTICLES].sort(byDateDesc)[0];
}

/** One article by slug (and category, which also guards the nested route). */
export async function getArticle(category: CategorySlug, slug: string): Promise<Article | null> {
  return ALL_ARTICLES.find((a) => a.slug === slug && a.category === category) ?? null;
}

/** Every slug/category pair, for generateStaticParams and the sitemap. */
export async function getAllArticles(): Promise<Article[]> {
  return [...ALL_ARTICLES].sort(byDateDesc);
}

/** Cards for one category, newest first. */
export async function getCategoryCards(category: CategorySlug): Promise<ArticleCard[]> {
  return ALL_ARTICLES.filter((a) => a.category === category).sort(byDateDesc).map(toCard);
}

/**
 * A page of cards for the hub's lazy-loading grid. Optionally scoped to a
 * category, and optionally excluding the feature piece (which the hub pins).
 */
export async function getCards(opts: {
  offset?: number;
  limit?: number;
  category?: CategorySlug;
  excludeFeatured?: boolean;
} = {}): Promise<{ cards: ArticleCard[]; total: number; nextOffset: number | null }> {
  const { offset = 0, limit = 6, category, excludeFeatured } = opts;
  let list = [...ALL_ARTICLES].sort(byDateDesc);
  if (category) list = list.filter((a) => a.category === category);
  if (excludeFeatured) list = list.filter((a) => !a.featured);
  const total = list.length;
  const page = list.slice(offset, offset + limit).map(toCard);
  const end = offset + limit;
  return { cards: page, total, nextOffset: end < total ? end : null };
}

/**
 * Related articles for interlinking: the article's explicit `related` list when
 * set, otherwise same-category siblings, topped up with the category pillar.
 */
export async function getRelated(article: Article, max = 3): Promise<ArticleCard[]> {
  const pick: Article[] = [];
  const add = (a?: Article) => { if (a && a.slug !== article.slug && !pick.some((p) => p.slug === a.slug)) pick.push(a); };

  for (const slug of article.related ?? []) add(ALL_ARTICLES.find((a) => a.slug === slug));
  for (const a of [...ALL_ARTICLES].sort(byDateDesc)) {
    if (pick.length >= max) break;
    if (a.category === article.category) add(a);
  }
  // Always surface the category pillar if room remains.
  add(ALL_ARTICLES.find((a) => a.category === article.category && a.pillar));

  return pick.slice(0, max).map(toCard);
}

export { CATEGORIES as RESOURCE_CATEGORIES };
