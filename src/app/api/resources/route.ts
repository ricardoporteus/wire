/**
 * Public, anonymous feed for the Resources hub's lazy-loading grid. Returns a
 * page of article cards as JSON. No auth (middleware leaves /api open and this
 * handler never calls Clerk). Cards carry no body, so this stays cheap.
 */
import { getCards } from "@/content/resources";
import type { CategorySlug } from "@/content/resources/types";

export const runtime = "nodejs";

const CATEGORIES = new Set<CategorySlug>(["ai-search", "seo", "content-gtm"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit") ?? 6) || 6));
  const catParam = url.searchParams.get("category");
  const category = catParam && CATEGORIES.has(catParam as CategorySlug) ? (catParam as CategorySlug) : undefined;

  const { cards, total, nextOffset } = await getCards({ offset, limit, category, excludeFeatured: !category });

  return Response.json(
    { cards, total, nextOffset },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
