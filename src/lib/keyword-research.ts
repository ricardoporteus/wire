/**
 * Measured keyword research: Claude for judgment, DataForSEO for the numbers.
 *
 * Replaces the web-search keyword stage, which produced plausible phrases that
 * mostly had no measurable search volume (3–13% did, across the eval brands)
 * and guessed difficulty. Validated in src/eval/keyword-trial.ts.
 *
 *   1. discoverKeywords  Claude writes short seed phrases from the Brand Brain,
 *                        boiling any prior/pinned phrases down to their core
 *                        search. Google Trends adds rising/top related queries.
 *                        Labs measures all of them, expands them into related
 *                        keywords in relevance order, and pulls competitor rankings.
 *   2. selectKeywords    Competitor keywords stay only when on-topic (a competitor's
 *                        top traffic is mostly glossary pages). Claude rates every
 *                        candidate 1–5 for buyer fit, ignoring volume, and rejects
 *                        brand names, wrong audiences, products the brand doesn't
 *                        sell and claims it can't make. Close variants collapse.
 *   3. finalizeKeywords  Search Intent API, a live SERP check on the top picks,
 *                        Claude reads page one to choose the format Google
 *                        rewards, then the 0–100 opportunity score and priority.
 *
 * Three phases so the pipeline can run each as its own Inngest step: a whole
 * pass takes minutes (Trends is slow), too close to a serverless timeout for one
 * step, and a retry should not re-buy data an earlier phase already paid for.
 * Every phase's input and output is plain JSON for the same reason.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { BrandBrain } from "@/lib/brand-brain.zod";
import { DataForSEO, type KeywordMetrics, type Locale, type SerpFeatures } from "@/lib/dataforseo";
import { parseJson } from "@/lib/parse-json";

const anthropic = new Anthropic();
const MODEL = "claude-haiku-4-5";
const HAIKU = { in: 1, out: 5 }; // $/1M tokens

export type Bucket = "high_intent" | "informational" | "long_tail";
type Source = "prior" | "seed" | "trend" | "idea" | "competitor";

export type ResearchedKeyword = {
  phrase: string;
  bucket: Bucket;
  rationale: string;
  fit: number;                 // 3–5 (lower never survives)
  metrics: KeywordMetrics;     // volume, kd, cpc, Labs intent, trend
  searchIntent: string | null; // Search Intent API label, falling back to Labs
  variants: string[];          // close variants merged into this keyword
  source: Source;
  serp: SerpFeatures | null;   // only the top picks get a live SERP check
  format: string | null;       // one of the brand's formats, chosen from page one
  formatReason: string | null;
  score: number;               // 0–100
  priority: 1 | 2 | 3;         // by rank: top 10 P1, next 15 P2, rest P3
  difficulty: "low" | "medium" | "high" | null;
};

/** Tokens and dollars one phase spent. Summed by the caller for COGS. */
export type PhaseCost = { tokensIn: number; tokensOut: number; costUsdMicros: number };

export type ResearchOptions = {
  brain: BrandBrain;
  system: string;              // the brand-context system prompt (RESEARCH_SYSTEM)
  locale?: Locale;
  dfs?: DataForSEO;            // defaults to a fresh client from env credentials
  onProgress?: Progress;
};

export type Progress = (message: string, count?: number) => unknown;

export type Discovery = PhaseCost & {
  prior: string[];
  seeds: string[];
  trendQueries: string[];
  pool: KeywordMetrics[];      // everything measured, deduped, in relevance order
  competitor: string[];        // pool keywords a competitor ranks for
  offTopic: string[];          // competitor-only keywords sharing no topic word with the seeds
};

type Pick = { phrase: string; bucket: Bucket; reason: string; fit: number; variants: string[]; source: Source; metrics: KeywordMetrics };
export type Selection = PhaseCost & {
  picks: Pick[];
  funnel: { rated: number; rejected: number; merged: number };
};

export type KeywordResearchResult = {
  keywords: ResearchedKeyword[];
  peopleAlsoAsk: string[];     // real PAA questions from the SERP-checked picks
  tokensIn: number;
  tokensOut: number;
  costUsdMicros: number;       // Claude + DataForSEO, all phases
  funnel: { trendQueries: number; measured: number; offTopicCompetitor: number; rated: number; rejected: number; merged: number };
};

/** DataForSEO KD → the high/medium/low label every screen shows. */
export const kdBucket = (kd: number | null | undefined) =>
  kd == null ? null : kd < 30 ? "low" as const : kd < 60 ? "medium" as const : "high" as const;

/** The brand's main market: first listed geography (DataForSEO location names are country names). */
export function localeFor(brain: BrandBrain, location?: string): Locale {
  return {
    location_name: location ?? brain.icp.geographies[0] ?? "United States",
    language_code: (brain.voice.locale ?? "en").split("-")[0].toLowerCase(),
  };
}

/* ============================== 1. discovery ============================== */

export async function discoverKeywords(
  opts: ResearchOptions & { priorPhrases?: string[]; trends?: number },
): Promise<Discovery> {
  const { brain } = opts;
  const locale = opts.locale ?? localeFor(brain);
  const dfs = opts.dfs ?? new DataForSEO();
  const dfsStart = dfs.costUsd;
  const progress = opts.onProgress ?? (() => {});
  const { ask, usage } = asker(opts.system);
  const prior = [...new Set((opts.priorPhrases ?? []).map((p) => p.toLowerCase().trim()).filter(Boolean))].slice(0, 100);

  await progress("Writing seed searches from your Brand Brain");
  // Prior phrases are good ideas but often too specific to carry volume, so the
  // seed step boils each down to the short phrase people actually type.
  const fromPrior = prior.length
    ? `\n\nThese phrases were found or pinned before. Many are too long to have measurable search volume. Include the 2–4 word core search behind each one that fits (e.g. "reduce month-end close time" → "month end close"):\n${prior.map((p) => `- ${p}`).join("\n")}`
    : "";
  const seeds = (await ask(
    `List 40 short seed search phrases (2–4 words) this brand's ICP types into Google when they have the problems this brand solves. Mix problem phrases, solution/category phrases, comparison phrases and question stems. No brand names except competitors.${fromPrior}\n\nReturn {"seeds":["..."]}`,
    z.object({ seeds: z.array(z.string()).min(5) }),
  )).seeds.map((s) => s.toLowerCase().trim());

  const trendQueries = new Set<string>();
  const trendCount = opts.trends ?? 8;
  if (trendCount > 0) {
    await progress("Checking Google Trends for rising searches");
    // Trends is the slowest endpoint (~15s a call); sequential lookups took half
    // the step's time budget, so run them a few at a time.
    const results = await inBatches(seeds.slice(0, trendCount), 4,
      (seed) => dfs.trendsExplore(seed, locale).catch(() => ({ rising: [], top: [] })));
    for (const t of results) for (const q of [...t.rising, ...t.top]) if (!seeds.includes(q)) trendQueries.add(q);
  }

  await progress("Measuring search volume and difficulty in Google data");
  const site = domainOf(brain.siteUrl);
  const competitorDomains = brain.competitors.map((c) => domainOf(c.url)).filter((d): d is string => !!d);
  const [measured, ideas, ...perCompetitor] = await Promise.all([
    dfs.keywordOverview([...new Set([...prior, ...seeds, ...trendQueries])], locale),
    dfs.keywordIdeas([...seeds, ...trendQueries].slice(0, 200), locale, 300),
    // With a real brand domain, ask for the true gap; otherwise just what they rank for.
    ...competitorDomains.map((d) => (site && !site.endsWith(".example")
      ? dfs.gapKeywords(d, site, locale, 100)
      : dfs.rankedKeywords(d, locale, 100)).catch(() => [] as KeywordMetrics[])),
  ]);
  const competitorKws = perCompetitor.flat();

  // Relevance order, never volume order: prior and seeds first (the brand's own
  // vocabulary), then Labs ideas as DataForSEO ranked them, then competitor
  // keywords. Volume-sorting flooded the pool with head terms.
  const pool = byKeyword([...measured, ...ideas, ...competitorKws]);
  // A competitor's top traffic is mostly glossary pages. Flag competitor-only
  // keywords that share no topic word with the seeds; selection skips them.
  const topicWords = new Set([...seeds, ...prior].flatMap(words));
  const found = new Set([...measured, ...ideas].map((k) => k.keyword));
  const offTopic = competitorKws.filter((k) => !found.has(k.keyword) && !words(k.keyword).some((w) => topicWords.has(w)));
  await progress(`Measured ${pool.size} keywords`, pool.size);

  return {
    prior, seeds, trendQueries: [...trendQueries],
    pool: [...pool.values()],
    competitor: competitorKws.map((k) => k.keyword),
    offTopic: [...new Set(offTopic.map((k) => k.keyword))],
    tokensIn: usage.in, tokensOut: usage.out,
    costUsdMicros: Math.round((usage.usd + dfs.costUsd - dfsStart) * 1_000_000),
  };
}

/* ============================== 2. selection ============================== */

export async function selectKeywords(opts: ResearchOptions, d: Discovery): Promise<Selection> {
  const { brain } = opts;
  const progress = opts.onProgress ?? (() => {});
  const { ask, usage } = asker(opts.system);
  const pool = new Map(d.pool.map((k) => [k.keyword, k]));
  const sourceOf = sourcer(d);

  const competitorNames = brain.competitors.flatMap((c) => [c.name, domainOf(c.url)?.split(".")[0]])
    .filter((n): n is string => !!n && n.length > 2).map((n) => n.toLowerCase());
  // Deterministic backstop to the prompt rule: a competitor's name is only fair
  // game in a comparison or alternatives search.
  const brandSearch = (kw: string) =>
    competitorNames.some((n) => kw.includes(n)) && !/\b(vs|versus|alternatives?|compare|comparison)\b/.test(kw);
  const offTopic = new Set(d.offTopic);
  const candidates = d.pool
    .filter((k) => (k.searchVolume ?? 0) > 0 && !offTopic.has(k.keyword) && !brandSearch(k.keyword))
    .slice(0, 300);

  await progress(`Rating ${candidates.length} keywords for fit with your buyer`, candidates.length);
  const table = candidates.map((k) => `${k.keyword} | vol ${k.searchVolume} | kd ${k.kd ?? "?"} | ${k.intent ?? "?"}`).join("\n");
  const rated = (await ask(
    `Below are real keywords with measured monthly Google volume (vol), keyword difficulty 0–100 (kd) and search intent. Rate each for how well it fits ${brain.name}. Volume does NOT matter for the rating; judge fit only.

What ${brain.name} sells: ${brain.whatTheyDo}
Its positioning: ${brain.differentiator ?? "—"}
Its buyer: ${brain.icp.who}

5 = this exact buyer types it while having the problem ${brain.name} solves, and it is about what ${brain.name} actually sells
4 = clearly this buyer's world: an adjacent problem, or evaluating the kind of solution ${brain.name} sells
3 = this buyer might search it but so do many others; OR it is about a neighbouring product the brand does not sell (a different supplement, a different type of financing, a neighbouring software category) — never rate those above 3
2 or 1 = wrong audience or off-topic — do not return

Always reject (do not return), however popular:
- any keyword containing a company, product or brand name, EXCEPT comparison or alternatives searches involving the listed competitors (e.g. "x vs y", "x alternatives")
- a different audience than the buyer (consumer searches for a business product or vice versa; students and job seekers: degrees, salaries, careers)
- generic dictionary or glossary terms, unless the concept is the core of what ${brain.name} does
- promises that contradict the brand's positioning or claims (e.g. "same day" when it promises same-week; "cheap" for a premium brand)
- anything the brand could not credibly publish on (e.g. payday-style loans for a responsible lender, medical treatment claims for a supplement brand)

Return ONLY keywords rated 3–5. Copy each phrase EXACTLY as written. bucket: high_intent (ready to buy/act), informational (researching), long_tail (specific, lower volume). Reason: max 15 words, why it fits this buyer.

${table}

Return {"rated":[{"phrase":"...","fit":5,"bucket":"high_intent|informational|long_tail","reason":"..."}]}`,
    z.object({ rated: z.array(z.object({
      phrase: z.string(), fit: z.coerce.number().int().min(1).max(5),
      bucket: z.enum(["high_intent", "informational", "long_tail"]), reason: z.string(),
    })) }),
    16000,
  )).rated;
  // Guard against paraphrasing and rubric slips: only measured phrases rated 3+.
  const valid = rated
    .map((r) => ({ ...r, phrase: r.phrase.toLowerCase() }))
    .filter((r) => r.fit >= 3 && pool.has(r.phrase) && !brandSearch(r.phrase));

  // Collapse close variants ("melatonin-free sleep supplement(s)", "working capital
  // business loan" / "business working capital loan"): one piece targets them all.
  // The highest-fit, then highest-volume phrase leads; the rest become variants.
  const clusters = new Map<string, typeof valid>();
  for (const r of valid) {
    const key = clusterKey(r.phrase);
    clusters.set(key, [...(clusters.get(key) ?? []), r]);
  }
  const vol = (p: string) => pool.get(p)?.searchVolume ?? 0;
  const merged = [...clusters.values()].map((group) => {
    const [lead, ...rest] = [...group].sort((a, b) => b.fit - a.fit || vol(b.phrase) - vol(a.phrase));
    return { ...lead, variants: rest.map((r) => r.phrase).sort((a, b) => vol(b) - vol(a)) };
  });

  // Pick by score, strongest fit first: every 4–5 that scores (max 35), topped up with 3s to reach 30.
  const prelim = merged
    .map((r) => ({ r, s: opportunityScore(pool.get(r.phrase)!, pool.get(r.phrase)!.intent, null, sourceOf(r.phrase), r.fit) }))
    .sort((a, b) => b.s - a.s);
  const strong = prelim.filter((x) => x.r.fit >= 4).slice(0, 35);
  const fill = strong.length < 30 ? prelim.filter((x) => x.r.fit === 3).slice(0, 30 - strong.length) : [];

  return {
    picks: [...strong, ...fill].map(({ r }) => ({
      phrase: r.phrase, bucket: r.bucket, reason: r.reason, fit: r.fit, variants: r.variants,
      source: sourceOf(r.phrase), metrics: pool.get(r.phrase)!,
    })),
    funnel: { rated: candidates.length, rejected: candidates.length - valid.length, merged: valid.length - merged.length },
    tokensIn: usage.in, tokensOut: usage.out, costUsdMicros: Math.round(usage.usd * 1_000_000),
  };
}

/* ============================== 3. finalize ============================== */

export async function finalizeKeywords(
  opts: ResearchOptions & { serp?: number },
  d: Discovery, s: Selection,
): Promise<KeywordResearchResult> {
  const { brain } = opts;
  const locale = opts.locale ?? localeFor(brain);
  const dfs = opts.dfs ?? new DataForSEO();
  const dfsStart = dfs.costUsd;
  const progress = opts.onProgress ?? (() => {});
  const { ask, usage } = asker(opts.system);
  const picks = s.picks;

  await progress("Classifying search intent");
  const intents = await dfs.searchIntent(picks.map((p) => p.phrase), locale.language_code)
    .catch(() => new Map<string, { intent: string; probability: number | null }>());

  const serpCount = opts.serp ?? 10;
  const serps = new Map<string, SerpFeatures>();
  if (serpCount > 0) {
    await progress(`Checking live Google results for your top ${Math.min(serpCount, picks.length)} keywords`);
    const results = await inBatches(picks.slice(0, serpCount), 5, (p) => dfs.serp(p.phrase, locale).catch(() => null));
    for (const r of results) if (r) serps.set(r.keyword, r);
  }

  // Claude reads page one and picks the format Google is rewarding, from the
  // formats this brand actually publishes (a title pattern-match said "article"
  // for nearly everything).
  const allowed = brain.formats.map((f) => f.format as string);
  const formats = new Map<string, { format: string; reason: string }>();
  if (serps.size) {
    const pages = [...serps.values()].map((r) =>
      `### ${r.keyword}\nfeatures: ${[r.aiOverview && "AI Overview", r.featuredSnippet && "featured snippet", r.peopleAlsoAsk.length && `${r.peopleAlsoAsk.length} People Also Ask`].filter(Boolean).join(", ") || "none"}\n${r.topTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    ).join("\n\n");
    const chosen = await ask(
      `For each keyword below you have the top Google results. Decide which format to write so it can compete on that page — match what page one rewards (all "Best X" lists → listicle; step-by-step guides → how_to; direct questions → faq_page). Choose ONLY from: ${allowed.join(", ")}. If what page one rewards is not in that list, pick the closest one and say in the reason what page one actually rewards (e.g. "page one is all ranked lists; write the article as a ranked list"). Reason: max 20 words, citing what page one shows.

${pages}

Return {"formats":[{"phrase":"...","format":"...","reason":"..."}]}`,
      z.object({ formats: z.array(z.object({ phrase: z.string(), format: z.string(), reason: z.string() })) }),
    ).then((r) => r.formats).catch(() => []); // formats are advice; never fail the run over them
    for (const f of chosen) if (allowed.includes(f.format)) formats.set(f.phrase.toLowerCase(), f);
  }

  const keywords: ResearchedKeyword[] = picks.map((p) => {
    const serp = serps.get(p.phrase) ?? null;
    const searchIntent = intents.get(p.phrase)?.intent ?? p.metrics.intent;
    const f = formats.get(p.phrase);
    return {
      phrase: p.phrase, bucket: p.bucket, rationale: p.reason, fit: p.fit, metrics: p.metrics, searchIntent,
      variants: p.variants, source: p.source, serp, format: f?.format ?? null, formatReason: f?.reason ?? null,
      score: opportunityScore(p.metrics, searchIntent, serp, p.source, p.fit),
      priority: 3, difficulty: kdBucket(p.metrics.kd),
    };
  }).sort((a, b) => b.score - a.score)
    .map((k, i) => ({ ...k, priority: (i < 10 ? 1 : i < 25 ? 2 : 3) as 1 | 2 | 3 }));

  return {
    keywords,
    peopleAlsoAsk: [...new Set([...serps.values()].flatMap((r) => r.peopleAlsoAsk))],
    tokensIn: d.tokensIn + s.tokensIn + usage.in,
    tokensOut: d.tokensOut + s.tokensOut + usage.out,
    costUsdMicros: d.costUsdMicros + s.costUsdMicros + Math.round((usage.usd + dfs.costUsd - dfsStart) * 1_000_000),
    funnel: {
      trendQueries: d.trendQueries.length, measured: d.pool.length,
      offTopicCompetitor: d.offTopic.length,
      ...s.funnel,
    },
  };
}

/** All three phases in one call — for the eval and any caller without step boundaries. */
export async function researchKeywords(
  opts: ResearchOptions & { priorPhrases?: string[]; trends?: number; serp?: number },
): Promise<KeywordResearchResult> {
  const d = await discoverKeywords(opts);
  const s = await selectKeywords(opts, d);
  return finalizeKeywords(opts, d, s);
}

/* ------------------------------- scoring ------------------------------- */

const INTENT_WEIGHT: Record<string, number> = { transactional: 1.3, commercial: 1.2, informational: 1.0, navigational: 0.3 };
const FIT_WEIGHT: Record<number, number> = { 5: 1, 4: 0.75, 3: 0.45 };

/**
 * One opportunity number per keyword, 0–100. Multiplicative so a single fatal
 * weakness (poor fit, navigational intent, KD 95) sinks the score however big the volume.
 *   fit       1–5 buyer fit: 5 → 1, 4 → 0.75, 3 → 0.45. Without it the first trial
 *             ranked "direct deposits" top for a spend-management brand.
 *   volume    log-scaled, capped at 10k: 10 → 1, 1,000 → 3, 10,000+ → 4, so a
 *             generic head term can't outscore a specific phrase on volume alone
 *   ease      (100 − KD) / 100; unmeasured KD treated as 50
 *   intent    buyers over browsers; navigational means someone else's brand
 *   CPC       advertisers pay for it → it converts; capped at +50%
 *   SERP      featured snippet +10% (a winnable answer box); AI Overview −10%
 *             (fewer clicks) — both only known for SERP-checked picks
 *   gap       a competitor already ranks for it: proven demand, +15%
 */
export function opportunityScore(m: KeywordMetrics, intent: string | null, serp: SerpFeatures | null, source: Source, fit: number): number {
  const fitW = FIT_WEIGHT[fit] ?? 0;
  const volume = Math.min(4, Math.log10((m.searchVolume ?? 0) + 1));
  const ease = (100 - (m.kd ?? 50)) / 100;
  const intentW = INTENT_WEIGHT[intent ?? ""] ?? 1;
  const cpc = 1 + Math.min(m.cpc ?? 0, 20) / 40;
  const serpAdj = (serp?.featuredSnippet ? 1.1 : 1) * (serp?.aiOverview ? 0.9 : 1);
  const gap = source === "competitor" ? 1.15 : 1;
  // Max realistic raw ≈ 1 × 4 × 1 × 1.3 × 1.5 × 1.1 × 1.15 ≈ 9.9 → scale to 100.
  return Math.min(100, Math.round((fitW * volume * ease * intentW * cpc * serpAdj * gap / 9.9) * 100));
}

/* ------------------------------- helpers ------------------------------- */

/** A tool-free Haiku caller that must return JSON matching `schema` (one repair retry), plus its running usage. */
function asker(system: string) {
  const usage = { in: 0, out: 0, usd: 0 };
  async function ask<T>(prompt: string, schema: z.ZodType<T>, maxTokens = 6000): Promise<T> {
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await anthropic.messages.create({ model: MODEL, max_tokens: maxTokens, system, messages });
      usage.in += res.usage.input_tokens; usage.out += res.usage.output_tokens;
      usage.usd += (res.usage.input_tokens * HAIKU.in + res.usage.output_tokens * HAIKU.out) / 1_000_000;
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      const parsed = schema.safeParse(parseJson(text));
      if (parsed.success) return parsed.data;
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: `That did not validate: ${parsed.error.message.slice(0, 400)}. Reply with ONLY the JSON object.` });
    }
    throw new Error("Model did not return valid JSON");
  }
  return { ask, usage };
}

/** Run `fn` over `items`, `size` at a time, preserving order. */
async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  return out;
}

function sourcer(d: Discovery): (kw: string) => Source {
  const prior = new Set(d.prior), seeds = new Set(d.seeds), trends = new Set(d.trendQueries), comp = new Set(d.competitor);
  return (kw) => prior.has(kw) ? "prior" : comp.has(kw) ? "competitor" : trends.has(kw) ? "trend" : seeds.has(kw) ? "seed" : "idea";
}

const STOP = new Set(["the", "and", "for", "with", "how", "what", "best", "vs", "to", "of", "in", "a", "is", "my", "your", "do", "does", "can", "on", "top", "free", "near", "me"]);
/** Content words, singularized crudely ("loans" → "loan") so plurals match. */
function words(kw: string): string[] {
  return kw.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/s$/, ""));
}

/**
 * Same words, any order, any hyphenation, singular or plural, ignoring
 * connectors → same key: "valerian root for sleep" = "valerian root sleep",
 * "alternatives to melatonin" = "melatonin alternatives". Meaning-bearing small
 * words ("without", "vs", "best") are kept.
 */
const CONNECTORS = new Set(["a", "an", "the", "for", "to", "of", "in", "on", "at", "and", "with", "my", "your"]);
function clusterKey(kw: string): string {
  return kw.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !CONNECTORS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .sort().join(" ");
}

function byKeyword(rows: KeywordMetrics[]): Map<string, KeywordMetrics> {
  const out = new Map<string, KeywordMetrics>();
  for (const r of rows) if (!out.has(r.keyword)) out.set(r.keyword, r);
  return out;
}

export function domainOf(url: string | undefined): string | null {
  try { return url ? new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "") : null; } catch { return null; }
}
