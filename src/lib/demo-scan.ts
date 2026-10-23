/**
 * Public "Live Scan" teaser — a bounded, REAL scan of any domain, fast and cheap
 * enough to run per anonymous lead (~4¢, under ~12s):
 *
 *   1. scrape homepage + a few pages (parallel, real, free)
 *   2. IN PARALLEL: draft the Brand Brain on Haiku (the audit) AND generate seed
 *      phrases → expand them with DataForSEO keywordIdeas (real volume/difficulty)
 *   3. live page-one check on the top picks (parallel)
 *   4. score + rank; brief titles from a heuristic (no extra model call)
 *
 * The full 400+ keyword sweep and article writing stay post-sign-up on credits.
 * The draft is persisted so sign-up adopts it without re-scraping.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { and, desc, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { demoScans } from "@/db/schema";
import { DataForSEO, type Locale, type SerpFeatures } from "@/lib/dataforseo";
import { scrapeSite, draftBrain, type ScrapedPage } from "@/lib/brand-draft";
import { cacheKeywordMetrics } from "@/lib/keyword-metrics-cache";
import { opportunityScore, kdBucket, domainOf } from "@/lib/keyword-research";
import { parseJson } from "@/lib/parse-json";
import type { BrandBrainDraft } from "@/lib/brand-brain.zod";
import type {
  DemoBrand, DemoBrief, DemoEvent, DemoKeyword, DemoPageOne, DemoScanResult,
} from "@/lib/demo-scan-types";

const HAIKU_MODEL = "claude-haiku-4-5";
const HAIKU = { in: 1, out: 5 };    // $/1M tokens
const DRAFT_MAX_TOKENS = 1800;      // lean draft keeps the scan fast
const SEED_TARGET = 10;
const KEEP_MAX = 14;
const SERP_CHECKS = 2;              // parallel page-one checks on the top picks
const BRIEF_COUNT = 6;
const DOMAIN_CACHE_DAYS = 30;
// Teaser uses a fixed main market for speed; the full post-signup sweep uses the
// brand's real geography. US volumes are a fine preview for most brands.
const LOCALE: Locale = { location_name: "United States", language_code: "en" };

export type DemoProgress = (ev: DemoEvent) => void;

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
    if (pages.length === 0) {
      throw new Error("We can't preview enterprise sites here. Log in to try.");
    }

    /* 2. draft + measurement IN PARALLEL */
    onProgress({ t: "stage", stage: "drafting", message: "Learning your brand" });
    await db.update(demoScans).set({ status: "drafting" }).where(eq(demoScans.token, token));
    const ask = haikuAsker();

    const draftP = draftBrain(url, pages, { model: HAIKU_MODEL, maxTokens: DRAFT_MAX_TOKENS });
    const measureP = (async () => {
      const seeds = await ask.seeds(briefFromPages(domain, pages));
      const ideas = await dfs.keywordIdeas(seeds.slice(0, SEED_TARGET), LOCALE, 40);
      await cacheKeywordMetrics(ideas, LOCALE).catch(() => {});
      return ideas;
    })();

    // Brand first (narrative order), while measurement finishes concurrently.
    const draftRes = await draftP;
    tokensIn += draftRes.tokensIn; tokensOut += draftRes.tokensOut;
    usd += (draftRes.tokensIn * HAIKU.in + draftRes.tokensOut * HAIKU.out) / 1_000_000;
    const draft = draftRes.brain;
    const brand = toBrand(draft);
    for (const [label, value] of brandFields(brand)) onProgress({ t: "brandField", label, value });

    /* keywords */
    onProgress({ t: "stage", stage: "measuring", message: "Measuring real demand" });
    await db.update(demoScans).set({ status: "measuring" }).where(eq(demoScans.token, token));
    const measured = await measureP;
    tokensIn += ask.usage.in; tokensOut += ask.usage.out; usd += ask.usage.usd;

    const scored = measured
      .filter((m) => (m.searchVolume ?? 0) > 0)
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

    /* 3. page-one check on the top picks (parallel) */
    onProgress({ t: "stage", stage: "pageone", message: "Checking Google's page one" });
    const top = kept.slice(0, SERP_CHECKS);
    const serps = await Promise.all(top.map((k) => dfs.serp(k.phrase, LOCALE).catch(() => null)));
    const pageOne: DemoPageOne[] = [];
    top.forEach((k, i) => {
      const s = serps[i];
      if (!s) return;
      const card: DemoPageOne = {
        phrase: k.phrase,
        aiOverview: s.aiOverview,
        peopleAlsoAsk: s.peopleAlsoAsk.slice(0, 4),
        featuredSnippet: s.featuredSnippet,
        recommendedFormat: recommendFormat(s),
      };
      pageOne.push(card);
      onProgress({ t: "pageone", card });
    });

    /* audit reveal */
    onProgress({ t: "stage", stage: "audit", message: "Auditing your brand" });
    onProgress({ t: "audit", brand });
    onProgress({ t: "stage", stage: "guardrails", message: "Brand guardrails" });

    /* 4. briefs (heuristic titles — no extra model call) */
    onProgress({ t: "stage", stage: "writing", message: "Drafting your plan" });
    const briefs: DemoBrief[] = kept.slice(0, BRIEF_COUNT).map((k) => ({
      title: titleFor(k.phrase),
      phrase: k.phrase,
      volume: k.volume,
      priority: k.priority,
    }));
    for (const brief of briefs) onProgress({ t: "brief", brief });

    const result: DemoScanResult = {
      domain, brand, keywords: kept, pageOne, briefs,
      counts: { measured: measured.length, kept: kept.length, briefs: briefs.length },
    };

    usd += dfs.costUsd;
    await db.update(demoScans)
      .set({
        status: "complete", result, brainDraft: draft,
        tokensIn, tokensOut, costUsdMicros: Math.round(usd * 1_000_000),
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

function briefFromPages(domain: string, pages: ScrapedPage[]): string {
  const home = pages.find((p) => p.path === "/")?.text ?? pages[0]?.text ?? "";
  return `Brand domain: ${domain}\nHomepage text: ${home.slice(0, 1800)}`;
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

function titleFor(phrase: string): string {
  const p = phrase.trim();
  const cap = p.charAt(0).toUpperCase() + p.slice(1);
  if (/\bvs\b/i.test(p)) return `${cap}: which is right for you?`;
  if (/^how /i.test(p)) return cap;
  if (/^best /i.test(p)) return `${cap} in ${new Date().getFullYear()}`;
  if (/^what /i.test(p)) return cap;
  return `${cap}: a complete guide`;
}

/* --------------------------- Haiku seed generation ------------------------- */

const seedsSchema = z.object({ phrases: z.array(z.string().min(2)).min(1) });

function haikuAsker() {
  const anthropic = new Anthropic();
  const usage = { in: 0, out: 0, usd: 0 };

  async function call<T>(system: string, prompt: string, schema: z.ZodType<T>, maxTokens = 500): Promise<T> {
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
    async seeds(brief: string): Promise<string[]> {
      const out = await call(
        "You generate realistic Google search phrases a brand's buyers would type. Output ONLY JSON.",
        `${brief}\n\nList ${SEED_TARGET} specific search phrases (3–6 words each) this brand's customers would type on Google, mixing high-intent (comparison, buying) and informational (how-to, explainer). No brand names. Return JSON: {"phrases": string[]}`,
        seedsSchema,
      );
      return out.phrases.map((p) => p.toLowerCase().trim()).filter(Boolean).slice(0, SEED_TARGET);
    },
  };
}
