/**
 * The query API for the Resources hub. Every route, component and the sitemap
 * read the library through these functions, never the raw array. To move the
 * corpus into the Neon/Drizzle DB (where Mavrix will write it), reimplement
 * these against the DB and make them async — call sites already `await` them.
 *
 * Publishing gate: the PUBLIC query functions return only live articles
 * (status "scheduled" and publishAt in the past). Future-dated and draft
 * articles stay hidden from the site, the sitemap and prerendering, and surface
 * automatically once their date passes (pages carry a revalidate window).
 * getQueue() is the one exception — it returns everything, for the admin view.
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

// --- publishing gate -------------------------------------------------------

/** Resolve the effective schedule, applying the legacy-live defaults. */
function schedule(a: Article): { status: "draft" | "scheduled"; publishAt: string } {
  return { status: a.status ?? "scheduled", publishAt: a.publishAt ?? a.datePublished };
}

/** Parse a date-only or full-ISO timestamp as UTC. */
function parseAt(iso: string): number {
  return Date.parse(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
}

/** Public visibility: approved for publishing and its date has arrived. */
function isLive(a: Article, now: number): boolean {
  const s = schedule(a);
  return s.status === "scheduled" && parseAt(s.publishAt) <= now;
}

/** The live corpus at call time, newest first. */
function liveArticles(): Article[] {
  const now = Date.now();
  return ALL_ARTICLES.filter((a) => isLive(a, now)).sort(byDateDesc);
}

// --- public reads (live only) ----------------------------------------------

/** The single feature piece for the hub hero. Falls back to the newest live one. */
export async function getFeatured(): Promise<Article | null> {
  const live = liveArticles();
  return live.find((a) => a.featured) ?? live[0] ?? null;
}

/** One live article by slug (and category, which also guards the nested route). */
export async function getArticle(category: CategorySlug, slug: string): Promise<Article | null> {
  const a = ALL_ARTICLES.find((x) => x.slug === slug && x.category === category);
  return a && isLive(a, Date.now()) ? a : null;
}

/** Every live slug/category pair, for generateStaticParams and the sitemap. */
export async function getAllArticles(): Promise<Article[]> {
  return liveArticles();
}

/** Live cards for one category, newest first. */
export async function getCategoryCards(category: CategorySlug): Promise<ArticleCard[]> {
  return liveArticles().filter((a) => a.category === category).map(toCard);
}

/** A page of live cards for the hub's lazy-loading grid. */
export async function getCards(opts: {
  offset?: number;
  limit?: number;
  category?: CategorySlug;
  excludeFeatured?: boolean;
} = {}): Promise<{ cards: ArticleCard[]; total: number; nextOffset: number | null }> {
  const { offset = 0, limit = 6, category, excludeFeatured } = opts;
  let list = liveArticles();
  if (category) list = list.filter((a) => a.category === category);
  if (excludeFeatured) list = list.filter((a) => !a.featured);
  const total = list.length;
  const page = list.slice(offset, offset + limit).map(toCard);
  const end = offset + limit;
  return { cards: page, total, nextOffset: end < total ? end : null };
}

/** Related live articles for interlinking. */
export async function getRelated(article: Article, max = 3): Promise<ArticleCard[]> {
  const live = liveArticles();
  const pick: Article[] = [];
  const add = (a?: Article) => { if (a && a.slug !== article.slug && !pick.some((p) => p.slug === a.slug)) pick.push(a); };

  for (const slug of article.related ?? []) add(live.find((a) => a.slug === slug));
  for (const a of live) { if (pick.length >= max) break; if (a.category === article.category) add(a); }
  add(live.find((a) => a.category === article.category && a.pillar));

  return pick.slice(0, max).map(toCard);
}

// --- admin read (everything, for the review queue) -------------------------

export type QueueLane = "draft" | "scheduled" | "live";
export type QueueItem = {
  slug: string;
  category: CategorySlug;
  title: string;
  type: Article["type"];
  author: Article["author"];
  readingMinutes: number;
  publishAt: string;
  lane: QueueLane;
};

/** All articles with their resolved schedule and lane, for the admin queue. */
export async function getQueue(): Promise<QueueItem[]> {
  const now = Date.now();
  return ALL_ARTICLES.map((a) => {
    const s = schedule(a);
    const lane: QueueLane = s.status === "draft" ? "draft" : parseAt(s.publishAt) > now ? "scheduled" : "live";
    return {
      slug: a.slug, category: a.category, title: a.title, type: a.type,
      author: a.author, readingMinutes: a.readingMinutes, publishAt: s.publishAt, lane,
    };
  }).sort((x, y) => x.publishAt.localeCompare(y.publishAt));
}

export { CATEGORIES as RESOURCE_CATEGORIES };
