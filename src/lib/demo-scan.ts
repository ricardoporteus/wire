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
import { scrapeSite, type ScrapedPage } from "@/lib/brand-draft";
import { cacheKeywordMetrics } from "@/lib/keyword-metrics-cache";
import { opportunityScore, kdBucket, domainOf } from "@/lib/keyword-research";
import { parseJson } from "@/lib/parse-json";
import type { BrandBrainDraft } from "@/lib/brand-brain.zod";
import type {
  DemoBrand, DemoBrief, DemoEvent, DemoKeyword, DemoPageOne, DemoScanResult,
} from "@/lib/demo-scan-types";

const HAIKU_MODEL = "claude-haiku-4-5";
const HAIKU = { in: 1, out: 5 };    // $/1M tokens
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

    const brief = briefFromPages(domain, pages);
    const auditP = ask.audit(brief);
    const measureP = (async () => {
      const seeds = await ask.seeds(brief);
      const ideas = await dfs.keywordIdeas(seeds.slice(0, SEED_TARGET), LOCALE, 40);
      await cacheKeywordMetrics(ideas, LOCALE).catch(() => {});
      return ideas;
    })();

    // Brand first (narrative order), while measurement finishes concurrently.
    const lean = await auditP;
    const brand = leanToBrand(lean, domain);
    const draft = leanToBrainDraft(lean, url);
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

function leanToBrand(a: DemoAudit, domain: string): DemoBrand {
  return {
    name: a.name || domain,
    whatTheyDo: a.whatYouDo,
    differentiator: a.differentiator,
    voicePillars: a.voicePillars.slice(0, 4),
    principles: a.principles.slice(0, 4),
    icpWho: a.idealCustomer,
    competitors: a.competitors.slice(0, 4),
    sayWords: a.sayWords.slice(0, 6),
    banWords: a.banWords.slice(0, 6),
    values: a.values.slice(0, 4),
    facts: a.facts.slice(0, 4),
    guardrails: a.guardrails.slice(0, 4),
  };
}

/** Build a Brand Brain draft (for adopt-on-signup) from the lean audit. Stored as jsonb; the wizard fills any gaps. */
function leanToBrainDraft(a: DemoAudit, siteUrl: string): BrandBrainDraft {
  return {
    name: a.name,
    siteUrl,
    whatTheyDo: a.whatYouDo || undefined,
    differentiator: a.differentiator,
    icp: a.idealCustomer
      ? { who: a.idealCustomer, segments: [], geographies: [], painPoints: [], searchBehaviour: "" }
      : undefined,
    competitors: a.competitors.filter((c) => !!c.url).map((c) => ({ url: c.url as string, name: c.name, note: c.note })),
    voice: a.voicePillars.length
      ? { pillars: a.voicePillars, personality: [], principles: a.principles, locale: "en-US" }
      : undefined,
    vocabulary: { preferredVerbs: [], preferredNouns: a.sayWords, preferredAdjectives: [], terminology: [], banned: a.banWords },
    values: a.values.length ? a.values : undefined,
    approvedFacts: a.facts,
    ethicsRules: a.guardrails,
  } as BrandBrainDraft;
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

// Loose, all-defaulted so Haiku satisfies it in one shot (no slow failing retry).
const demoAuditSchema = z.object({
  name: z.string().min(1),
  whatYouDo: z.string().default(""),
  differentiator: z.string().optional(),
  idealCustomer: z.string().default(""),
  voicePillars: z.array(z.object({ name: z.string(), description: z.string().default("") })).default([]),
  principles: z.array(z.string()).default([]),
  sayWords: z.array(z.string()).default([]),
  banWords: z.array(z.string()).default([]),
  competitors: z.array(z.object({ name: z.string().optional(), url: z.string().optional(), note: z.string().optional() })).default([]),
  values: z.array(z.object({ name: z.string(), description: z.string().default("") })).default([]),
  facts: z.array(z.object({ topic: z.string().default(""), fact: z.string() })).default([]),
  guardrails: z.array(z.string()).default([]),
});
type DemoAudit = z.infer<typeof demoAuditSchema>;

function haikuAsker() {
  const anthropic = new Anthropic();
  const usage = { in: 0, out: 0, usd: 0 };

  async function call<S extends z.ZodTypeAny>(system: string, prompt: string, schema: S, maxTokens = 500): Promise<z.infer<S>> {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await anthropic.messages.create({ model: HAIKU_MODEL, max_tokens: maxTokens, system, messages });
      usage.in += res.usage.input_tokens; usage.out += res.usage.output_tokens;
      usage.usd += (res.usage.input_tokens * HAIKU.in + res.usage.output_tokens * HAIKU.out) / 1_000_000;
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      const parsed = schema.safeParse(parseJson(text));
      if (parsed.success) return parsed.data;
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: `That did not validate: ${parsed.error.message.slice(0, 300)}. Reply with ONLY the JSON object, no prose.` });
    }
    throw new Error("Model did not return valid JSON");
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
    async audit(brief: string): Promise<DemoAudit> {
      return call(
        "You audit a brand from its website for a marketing team. Be specific and grounded; never invent facts or claims. Output ONLY JSON.",
        `${brief}\n\nReturn a brand audit as JSON with exactly these keys:\n{"name": string, "whatYouDo": string (2 plain sentences), "differentiator": string (1 sentence), "idealCustomer": string (one line), "voicePillars": [{"name": string, "description": string}] (3), "principles": string[] (3 short copy rules), "sayWords": string[] (4 on-brand words), "banWords": string[] (4 words to avoid), "competitors": [{"name": string, "url": string, "note": string}] (up to 3, only if genuinely inferable), "values": [{"name": string, "description": string}] (3), "facts": [{"topic": string, "fact": string}] (up to 3, ONLY claims actually on the site), "guardrails": string[] (3 content rules)}`,
        demoAuditSchema, 2200,
      );
    },
  };
}
