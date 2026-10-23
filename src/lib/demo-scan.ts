/**
 * Public "Live Scan" teaser — a bounded, REAL scan of any domain, cheap enough
 * to run per anonymous lead (~5¢ steady-state):
 *
 *   1. scrape the homepage + a few key pages (real, free)
 *   2. draft the Brand Brain on Haiku (cheap) — this is the audit the modal shows
 *   3. ask Haiku for ~18 buyer search phrases, measure them via the shared
 *      keyword cache (one DataForSEO call minus cache hits)
 *   4. live page-one check on the top ~3 picks
 *   5. score + rank, title the top few into briefs
 *
 * The full 400+ keyword sweep and article writing stay post-sign-up, billed on
 * credits. The draft is persisted so sign-up can adopt it without re-scraping.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { and, desc, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { demoScans } from "@/db/schema";
import { DataForSEO, type Locale, type SerpFeatures } from "@/lib/dataforseo";
import { scrapeSite, draftBrain } from "@/lib/brand-draft";
import { measureCached } from "@/lib/keyword-metrics-cache";
import { opportunityScore, kdBucket, domainOf } from "@/lib/keyword-research";
import { parseJson } from "@/lib/parse-json";
import type { BrandBrainDraft } from "@/lib/brand-brain.zod";
import type {
  DemoBrand, DemoBrief, DemoEvent, DemoKeyword, DemoPageOne, DemoScanResult,
} from "@/lib/demo-scan-types";

const HAIKU_MODEL = "claude-haiku-4-5";
const HAIKU = { in: 1, out: 5 }; // $/1M tokens
const SEED_TARGET = 18;          // phrases to measure
const KEEP_MAX = 14;             // keywords shown after ranking
const SERP_CHECKS = 3;           // live page-one checks on the top picks
const BRIEF_COUNT = 6;
const DOMAIN_CACHE_DAYS = 30;

export type DemoProgress = (ev: DemoEvent) => void;

/* --------------------------------- entry ---------------------------------- */

/**
 * Run (or serve from the per-domain cache) a teaser scan. Emits events as it
 * goes and returns the final result + the token to carry into sign-up.
 */
export async function runDemoScan(
  rawUrl: string,
  onProgress: DemoProgress,
): Promise<{ token: string; result: DemoScanResult }> {
  const domain = domainOf(rawUrl);
  if (!domain) throw new Error("That doesn't look like a valid website.");
  const url = rawUrl.includes("://") ? rawUrl : `https://${domain}`;

  // Per-domain cache: first visitor pays, everyone after is free.
  const cachedRow = await db.query.demoScans.findFirst({
    where: and(
      eq(demoScans.domain, domain),
      eq(demoScans.status, "complete"),
      gt(demoScans.createdAt, new Date(Date.now() - DOMAIN_CACHE_DAYS * 86_400_000)),
    ),
    orderBy: [desc(demoScans.createdAt)],
  });
  if (cachedRow?.result) {
    const token = cachedRow.token;
    const result: DemoScanResult = { ...cachedRow.result, cached: true };
    replay(result, token, onProgress);
    return { token, result };
  }

  const token = randomBytes(24).toString("base64url");
  await db.insert(demoScans).values({ token, url, domain, status: "scraping" });
  onProgress({ t: "token", token });

  let tokensIn = 0, tokensOut = 0, usd = 0;
  const dfs = new DataForSEO();

  try {
    /* 1. scrape */
    onProgress({ t: "stage", stage: "scraping", message: `Reading ${domain}` });
    const pages = await scrapeSite(url);
    if (pages.length === 0) throw new Error(`We couldn't read ${domain}. Check the URL and try again.`);

    /* 2. brand brain draft (Haiku) */
    onProgress({ t: "stage", stage: "drafting", message: "Learning your brand" });
    await db.update(demoScans).set({ status: "drafting" }).where(eq(demoScans.token, token));
    const draftRes = await draftBrain(url, pages, { model: HAIKU_MODEL });
    tokensIn += draftRes.tokensIn; tokensOut += draftRes.tokensOut;
    usd += (draftRes.tokensIn * HAIKU.in + draftRes.tokensOut * HAIKU.out) / 1_000_000;
    const draft = draftRes.brain;
    const brand = toBrand(draft);
    for (const [label, value] of brandFields(brand)) onProgress({ t: "brandField", label, value });

    /* 3. seeds → measure (cached) */
    onProgress({ t: "stage", stage: "measuring", message: "Measuring real demand" });
    await db.update(demoScans).set({ status: "measuring" }).where(eq(demoScans.token, token));
    const locale = localeForDraft(draft);
    const ask = haikuAsker();
    const seeds = await ask.seeds(draft);
    tokensIn += ask.usage.in; tokensOut += ask.usage.out; usd += ask.usage.usd;

    const measured = await measureCached(dfs, seeds, locale);
    const withVolume = measured.filter((m) => (m.searchVolume ?? 0) > 0);

    // score + rank (fit held neutral at 4 — the teaser skips the full rating pass)
    const scored = withVolume
      .map((m) => ({ m, score: opportunityScore(m, m.intent, null, "seed", 4) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, KEEP_MAX);

    const kept: DemoKeyword[] = scored.map(({ m, score }, i) => ({
      phrase: m.keyword,
      volume: m.searchVolume,
      kd: m.kd,
      difficulty: kdBucket(m.kd),
      intent: m.intent,
      priority: (i < 6 ? 1 : i < 10 ? 2 : 3) as 1 | 2 | 3,
      score,
    }));
    for (const row of kept) onProgress({ t: "keyword", row });
    onProgress({ t: "counts", measured: measured.length, kept: kept.length, briefs: Math.min(BRIEF_COUNT, kept.length) });

    /* 4. page-one check on the top picks */
    onProgress({ t: "stage", stage: "pageone", message: "Checking Google's page one" });
    const pageOne: DemoPageOne[] = [];
    for (const k of kept.slice(0, SERP_CHECKS)) {
      const s = await dfs.serp(k.phrase, locale).catch(() => null);
      if (!s) continue;
      const card: DemoPageOne = {
        phrase: k.phrase,
        aiOverview: s.aiOverview,
        peopleAlsoAsk: s.peopleAlsoAsk.slice(0, 4),
        featuredSnippet: s.featuredSnippet,
        recommendedFormat: recommendFormat(s),
      };
      pageOne.push(card);
      onProgress({ t: "pageone", card });
    }

    /* audit reveal (the reassurance beat) */
    onProgress({ t: "stage", stage: "audit", message: "Auditing your brand" });
    onProgress({ t: "audit", brand });
    onProgress({ t: "stage", stage: "guardrails", message: "Brand guardrails" });

    /* 5. briefs */
    onProgress({ t: "stage", stage: "writing", message: "Drafting your plan" });
    const top = kept.slice(0, BRIEF_COUNT);
    const titles = await ask.titles(brand.name, top.map((k) => k.phrase)).catch(() => null);
    tokensIn += ask.usage.in; tokensOut += ask.usage.out; usd += ask.usage.usd;
    const briefs: DemoBrief[] = top.map((k, i) => ({
      title: titles?.[i] || fallbackTitle(k.phrase),
      phrase: k.phrase,
      volume: k.volume,
      priority: k.priority,
    }));
    for (const brief of briefs) onProgress({ t: "brief", brief });

    const result: DemoScanResult = {
      domain,
      brand,
      keywords: kept,
      pageOne,
      briefs,
      counts: { measured: measured.length, kept: kept.length, briefs: briefs.length },
    };

    usd += dfs.costUsd;
    await db.update(demoScans)
      .set({
        status: "complete",
        result,
        brainDraft: draft,
        tokensIn, tokensOut,
        costUsdMicros: Math.round(usd * 1_000_000),
        completedAt: new Date(),
      })
      .where(eq(demoScans.token, token));

    onProgress({ t: "done", token, result });
    return { token, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "The scan couldn't complete.";
    await db.update(demoScans)
      .set({ status: "failed", error: message.slice(0, 500), costUsdMicros: Math.round((usd + dfs.costUsd) * 1_000_000) })
      .where(eq(demoScans.token, token))
      .catch(() => {});
    onProgress({ t: "error", message });
    throw e;
  }
}

/* -------------------------------- helpers --------------------------------- */

/** Stream a cached result through the same event sequence so the modal animates identically. */
function replay(result: DemoScanResult, token: string, onProgress: DemoProgress) {
  onProgress({ t: "token", token });
  onProgress({ t: "stage", stage: "scraping", message: `Reading ${result.domain}` });
  for (const [label, value] of brandFields(result.brand)) onProgress({ t: "brandField", label, value });
  onProgress({ t: "stage", stage: "measuring" });
  for (const row of result.keywords) onProgress({ t: "keyword", row });
  onProgress({ t: "counts", ...result.counts });
  onProgress({ t: "stage", stage: "pageone" });
  for (const card of result.pageOne) onProgress({ t: "pageone", card });
  onProgress({ t: "stage", stage: "audit" });
  onProgress({ t: "audit", brand: result.brand });
  onProgress({ t: "stage", stage: "writing" });
  for (const brief of result.briefs) onProgress({ t: "brief", brief });
  onProgress({ t: "done", token, result });
}

function localeForDraft(d: BrandBrainDraft): Locale {
  return {
    location_name: d.icp?.geographies?.[0] ?? "United States",
    language_code: (d.voice?.locale ?? "en").split("-")[0].toLowerCase(),
  };
}

function toBrand(d: BrandBrainDraft): DemoBrand {
  const v = d.vocabulary;
  const say = [...(v?.preferredVerbs ?? []), ...(v?.preferredNouns ?? []), ...(v?.preferredAdjectives ?? [])]
    .filter(Boolean).slice(0, 6);
  return {
    name: d.name,
    whatTheyDo: d.whatTheyDo ?? "",
    differentiator: d.differentiator,
    voicePillars: (d.voice?.pillars ?? []).slice(0, 4),
    principles: (d.voice?.principles ?? []).slice(0, 4),
    icpWho: d.icp?.who ?? "",
    competitors: (d.competitors ?? []).slice(0, 4),
    sayWords: say,
    banWords: (v?.banned ?? []).slice(0, 6),
    values: (d.values ?? []).slice(0, 4),
    facts: (d.approvedFacts ?? []).slice(0, 4),
    guardrails: (d.ethicsRules ?? []).slice(0, 4),
  };
}

function brandFields(b: DemoBrand): [string, string][] {
  const fields: [string, string][] = [["What you do", b.whatTheyDo]];
  if (b.differentiator) fields.push(["Differentiator", b.differentiator]);
  if (b.icpWho) fields.push(["Ideal customer", b.icpWho]);
  if (b.voicePillars.length) fields.push(["Voice", b.voicePillars.map((p) => p.name).join(" · ")]);
  return fields;
}

function recommendFormat(s: SerpFeatures): string {
  if (s.peopleAlsoAsk.length >= 3) return "Write as: step-by-step guide + FAQ";
  if (!s.featuredSnippet) return "Write as: listicle with a 40-word definition up top";
  return "Write as: comparison guide";
}

function fallbackTitle(phrase: string): string {
  const p = phrase.trim();
  const cap = p.charAt(0).toUpperCase() + p.slice(1);
  if (/\bvs\b/i.test(p)) return `${cap}: which is right for you?`;
  if (/^how /i.test(p)) return cap;
  if (/^best /i.test(p)) return `${cap} in ${new Date().getFullYear()}`;
  return `${cap}: a complete guide`;
}

/* --------------------------- Haiku judgment calls -------------------------- */

const seedsSchema = z.object({ phrases: z.array(z.string().min(2)).min(1) });
const titlesSchema = z.object({ titles: z.array(z.string().min(4)) });

function haikuAsker() {
  const anthropic = new Anthropic();
  const usage = { in: 0, out: 0, usd: 0 };

  async function call<T>(system: string, prompt: string, schema: z.ZodType<T>, maxTokens = 1200): Promise<T> {
    const res = await anthropic.messages.create({
      model: HAIKU_MODEL, max_tokens: maxTokens, system,
      messages: [{ role: "user", content: prompt }],
    });
    usage.in += res.usage.input_tokens; usage.out += res.usage.output_tokens;
    usage.usd += (res.usage.input_tokens * HAIKU.in + res.usage.output_tokens * HAIKU.out) / 1_000_000;
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    const parsed = schema.safeParse(parseJson(text));
    if (!parsed.success) throw new Error("Model did not return valid JSON");
    return parsed.data;
  }

  return {
    usage,
    async seeds(d: BrandBrainDraft): Promise<string[]> {
      const brief = [
        `Brand: ${d.name}`,
        d.whatTheyDo ? `Does: ${d.whatTheyDo}` : "",
        d.icp?.who ? `Customer: ${d.icp.who}` : "",
        d.icp?.searchBehaviour ? `Search behaviour: ${d.icp.searchBehaviour}` : "",
      ].filter(Boolean).join("\n");
      const out = await call(
        "You generate realistic Google search phrases a brand's buyers would type. Output ONLY JSON.",
        `${brief}\n\nList ${SEED_TARGET} specific search phrases (3–6 words each) this brand's customers would type on Google, mixing high-intent (comparison, buying) and informational (how-to, explainer). No brand names. Return JSON: {"phrases": string[]}`,
        seedsSchema,
      );
      return out.phrases.map((p) => p.toLowerCase().trim()).filter(Boolean).slice(0, SEED_TARGET);
    },
    async titles(brandName: string, phrases: string[]): Promise<string[]> {
      if (phrases.length === 0) return [];
      const out = await call(
        "You write compelling, specific blog article titles. Output ONLY JSON.",
        `Brand: ${brandName}. For each keyword below, write one article title (max 10 words, no clickbait, specific). Keep the same order.\nKeywords:\n${phrases.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nReturn JSON: {"titles": string[]}`,
        titlesSchema,
      );
      return out.titles;
    },
  };
}
