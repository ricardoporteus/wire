/**
 * Cross-tenant keyword-metrics cache. The same keyword has the same volume and
 * difficulty for every brand in a market, so we store what we measure and reuse
 * it across scans — a keyword measured once (per locale) is free thereafter.
 */
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { keywordMetricsCache } from "@/db/schema";
import type { DataForSEO, KeywordMetrics, Locale } from "@/lib/dataforseo";

const FRESH_DAYS = 30;

/** Upsert measured metrics into the shared cache (fresh-wins on conflict). */
export async function cacheKeywordMetrics(metrics: KeywordMetrics[], locale: Locale): Promise<void> {
  const seen = new Set<string>();
  const rows = metrics
    .filter((m) => m.keyword && !seen.has(m.keyword) && seen.add(m.keyword))
    .map((m) => ({
      keyword: m.keyword,
      locationName: locale.location_name,
      languageCode: locale.language_code,
      searchVolume: m.searchVolume,
      kd: m.kd == null ? null : Math.round(m.kd),
      cpc: m.cpc,
      intent: m.intent,
      trend: m.trend,
    }));
  if (!rows.length) return;
  await db
    .insert(keywordMetricsCache)
    .values(rows)
    .onConflictDoUpdate({
      target: [keywordMetricsCache.keyword, keywordMetricsCache.locationName, keywordMetricsCache.languageCode],
      set: {
        searchVolume: sql`excluded.search_volume`,
        kd: sql`excluded.kd`,
        cpc: sql`excluded.cpc`,
        intent: sql`excluded.intent`,
        trend: sql`excluded.trend`,
        measuredAt: sql`now()`,
      },
    });
}

/**
 * Measure a known list of keywords, reading fresh rows from the cache and
 * calling DataForSEO (one `keywordOverview`) only for the misses. Best for a
 * specific phrase list; for discovery use `keywordIdeas` + `cacheKeywordMetrics`.
 */
export async function measureCached(
  dfs: DataForSEO,
  keywords: string[],
  locale: Locale,
): Promise<KeywordMetrics[]> {
  const uniq = [...new Set(keywords.map((k) => k.toLowerCase().trim()).filter(Boolean))];
  if (uniq.length === 0) return [];

  const cutoff = new Date(Date.now() - FRESH_DAYS * 86_400_000);
  const cached = await db
    .select()
    .from(keywordMetricsCache)
    .where(
      and(
        eq(keywordMetricsCache.locationName, locale.location_name),
        eq(keywordMetricsCache.languageCode, locale.language_code),
        inArray(keywordMetricsCache.keyword, uniq),
        gt(keywordMetricsCache.measuredAt, cutoff),
      ),
    );

  const hit = new Set(cached.map((r) => r.keyword));
  const misses = uniq.filter((k) => !hit.has(k));

  let measured: KeywordMetrics[] = [];
  if (misses.length) {
    measured = await dfs.keywordOverview(misses, locale);
    await cacheKeywordMetrics(measured, locale);
  }

  const fromCache: KeywordMetrics[] = cached.map((r) => ({
    keyword: r.keyword,
    searchVolume: r.searchVolume,
    kd: r.kd,
    cpc: r.cpc,
    intent: r.intent,
    trend: r.trend ?? [],
  }));

  return [...fromCache, ...measured];
}
