/**
 * Typed content layer for the Resources hub (the blog / GTM library).
 *
 * This is the single seam between the rendering layer and the content source.
 * Today it is backed by a static registry (see ./articles.ts). When Mavrix
 * starts writing its ~30 articles/month into the Neon/Drizzle DB, only the
 * query functions in ./index.ts change — every component, route and the sitemap
 * read through this interface and stay untouched. The `Article` shape below is
 * deliberately close to what a `resources_articles` row would hold.
 */
import type { SpecialistId } from "@/app/(marketing)/_components/Avatars";

/** The three top-level pillars. Slugs are the URL segment under /resources. */
export type CategorySlug = "ai-search" | "seo" | "content-gtm";

/** Cross-cutting content format — a tag, rendered as a badge, not a category. */
export type ContentType = "deep-dive" | "how-to" | "tutorial" | "comparison" | "listicle";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Short editorial kicker shown on the hub rail. */
  tagline: string;
  /** One-line meta description for the category index page. */
  description: string;
  /** Palette token for the category's accent chip (CSS var name without --). */
  accent: "sky" | "lime" | "mint";
};

export type Author = {
  id: SpecialistId;
  name: string;
  role: string;
  /** Short bio shown in the article byline card. */
  bio: string;
};

/** One rendered block of article body. Authored content, so `html` is trusted. */
export type Block =
  | { k: "p"; html: string }
  | { k: "h2"; text: string; id: string }
  | { k: "h3"; text: string; id: string }
  | { k: "ul"; items: string[] }
  | { k: "ol"; items: string[] }
  | { k: "quote"; text: string; cite?: string }
  | { k: "callout"; title?: string; html: string }
  | { k: "table"; head: string[]; rows: string[][] };

export type Faq = { q: string; a: string };

export type Article = {
  slug: string;
  category: CategorySlug;
  type: ContentType;
  title: string;
  /** Standfirst / dek shown under the headline and as the meta description base. */
  excerpt: string;
  /** The exact search term this piece targets, surfaced in the brief. */
  targetKeyword: string;
  author: SpecialistId;
  datePublished: string; // ISO date
  dateModified: string; // ISO date
  readingMinutes: number;
  /**
   * Review gate. Omit both and the piece is live immediately (the original
   * seed set). For the drip workflow, a converted article lands as "draft"
   * (never public) until approved to "scheduled" with a future `publishAt`,
   * at which point it goes public automatically once that date passes.
   */
  status?: "draft" | "scheduled";
  publishAt?: string; // ISO date it goes live; defaults to datePublished

  /** True for the single hub feature piece. */
  featured?: boolean;
  /** True for a category's cornerstone piece that clusters link up to. */
  pillar?: boolean;
  tags: string[];
  /** Explicit interlinks; when omitted, related articles are inferred by category. */
  related?: string[];
  body: Block[];
  faq?: Faq[];
};

/** The lean shape the hub grid, rails and lazy-load API pass around. */
export type ArticleCard = Pick<
  Article,
  "slug" | "category" | "type" | "title" | "excerpt" | "author" | "datePublished" | "readingMinutes" | "featured" | "pillar"
>;
