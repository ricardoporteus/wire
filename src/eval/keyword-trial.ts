/**
 * Keyword research eval — measured research vs the old LLM-only stage.
 *
 * For each brand it runs two keyword pipelines side by side and writes a report:
 *
 *   A. Baseline: the old web-search keyword stage (Haiku + web search,
 *      model-estimated difficulty, no volumes), still the production fallback
 *      when DataForSEO is unavailable. Its phrases are looked up in DataForSEO to
 *      see how many real people search them and whether the model's difficulty
 *      label matches a measured score.
 *
 *   B. Production: the three phases from src/lib/keyword-research.ts, exactly
 *      as the intelligence pipeline runs them (timed, since each is one Inngest step), seeded with the baseline's phrases
 *      the way production seeds with a brand's existing and pinned keywords.
 *
 * Nothing is written to the database. Reports land in eval-out/keyword-trial/.
 *
 * Needs DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD (API credentials from
 * app.dataforseo.com → API Access) plus ANTHROPIC_API_KEY in .env.local.
 *
 * Run:  npm run eval:keywords                         (all synthetic tenants)
 *       npm run eval:keywords -- --tenant=ledgerly
 *       npm run eval:keywords -- --brain=<brand_brains.id>   (a real customer)
 *       npm run eval:keywords -- --serp=5 --skip-baseline    (cheaper re-runs)
 *       npm run eval:keywords -- --location="United Kingdom"
 *       npm run eval:keywords -- --trends=4                  (Trends lookups; 0 disables)
 */
import { loadEnvFile } from "node:process";
import { mkdirSync, writeFileSync } from "node:fs";
import type { BrandBrain } from "../lib/brand-brain.zod";
import type { KeywordMetrics, Locale } from "../lib/dataforseo";
import type { KeywordResearchResult } from "../lib/keyword-research";
try { loadEnvFile(".env.local"); } catch { /* rely on ambient env */ }

const arg = (flag: string) => process.argv.find((x) => x.startsWith(`--${flag}=`))?.split("=").slice(1).join("=");
const has = (flag: string) => process.argv.includes(`--${flag}`);
const OUT_DIR = "eval-out/keyword-trial";

type Baseline = { phrase: string; bucket: string; difficulty: string | null }[];

async function main() {
  // Env must be loaded before these modules construct their clients (dynamic import).
  const pipeline = await import("../jobs/intelligence-pipeline");
  const { DataForSEO } = await import("../lib/dataforseo");
  const { discoverKeywords, selectKeywords, finalizeKeywords, localeFor, kdBucket } = await import("../lib/keyword-research");

  const brains = await loadBrains();
  mkdirSync(OUT_DIR, { recursive: true });

  for (const { key, brain } of brains) {
    const locale = localeFor(brain, arg("location"));
    const dfs = new DataForSEO();
    const system = pipeline.RESEARCH_SYSTEM(brain);
    console.log(`\n▶ ${key} (${brain.name}) — ${locale.location_name}/${locale.language_code}`);
    const { balanceUsd } = await dfs.preflight(locale);
    console.log(`  DataForSEO ready, balance $${balanceUsd ?? "?"}`);

    /* ---------------- A. baseline: the old web-search stage ---------------- */
    let baseline: Baseline = [];
    let baselineUsd = 0;
    if (!has("skip-baseline")) {
      process.stdout.write("  baseline keyword stage (Haiku + web search) … ");
      const kw = await pipeline.researchStage({
        brain, instruction: pipeline.KEYWORD_INSTRUCTION, schema: pipeline.keywordStage,
        runId: "", stageKey: "researching_keywords", label: "Researching keywords",
      });
      baselineUsd = kw.costUsdMicros / 1_000_000;
      baseline = [
        ...kw.data.highIntent.map((k) => ({ phrase: k.phrase, bucket: "high_intent", difficulty: k.difficulty as string })),
        ...kw.data.informational.map((k) => ({ phrase: k.phrase, bucket: "informational", difficulty: k.difficulty as string })),
        ...kw.data.longTail.map((k) => ({ phrase: k.phrase, bucket: "long_tail", difficulty: null })),
      ];
      console.log(`${baseline.length} phrases, $${baselineUsd.toFixed(3)}`);
    }
    const baselineMeasured = baseline.length
      ? new Map((await dfs.keywordOverview(baseline.map((b) => b.phrase.toLowerCase()), locale)).map((m) => [m.keyword, m]))
      : new Map<string, KeywordMetrics>();
    const measureUsd = dfs.costUsd;

    /* ---------------- B. production research ---------------- */
    // The same three phases the pipeline runs as separate Inngest steps, timed:
    // each must finish well inside one serverless invocation.
    const opts = { brain, system, locale, dfs, onProgress: (msg: string) => console.log(`  ${msg}`) };
    const phase = async <T,>(name: string, fn: () => Promise<T>) => {
      const t0 = Date.now();
      const out = await fn();
      console.log(`  ⏱ ${name}: ${Math.round((Date.now() - t0) / 1000)}s`);
      return out;
    };
    const discovery = await phase("discover", () => discoverKeywords({ ...opts, priorPhrases: baseline.map((b) => b.phrase), trends: Number(arg("trends") ?? 8) }));
    const selection = await phase("select", () => selectKeywords(opts, discovery));
    const result = await phase("finalize", () => finalizeKeywords({ ...opts, serp: Number(arg("serp") ?? 10) }, discovery, selection));
    const aiVolume = await dfs.aiSearchVolume(result.peopleAlsoAsk.map((q) => q.toLowerCase()), locale)
      .catch(() => new Map<string, number | null>());

    const md = renderReport({ brain, locale, baseline, baselineMeasured, baselineUsd, measureUsd, result, aiVolume, kdBucket });
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const file = `${OUT_DIR}/${key}-${stamp}`;
    writeFileSync(`${file}.md`, md.markdown);
    writeFileSync(`${file}.json`, JSON.stringify({ locale, baseline, baselineMeasured: [...baselineMeasured.values()], result, aiVolume: Object.fromEntries(aiVolume) }, null, 2));
    console.log(md.summary);
    console.log(`  → ${file}.md`);
  }
  process.exit(0);
}

/* ------------------------------- inputs ------------------------------- */

async function loadBrains(): Promise<{ key: string; brain: BrandBrain }[]> {
  const brainId = arg("brain");
  if (brainId) {
    const { db } = await import("../lib/db");
    const { brandBrains } = await import("../db/schema");
    const { brandBrainSchema } = await import("../lib/brand-brain.zod");
    const { eq } = await import("drizzle-orm");
    const row = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, brainId) });
    if (!row) throw new Error(`No brand brain ${brainId}`);
    const parsed = brandBrainSchema.safeParse({ ...row, formats: row.formats });
    if (!parsed.success) throw new Error(`Brand brain ${brainId} is incomplete`);
    return [{ key: parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), brain: parsed.data }];
  }
  const { TENANTS } = await import("./tenants");
  const only = arg("tenant");
  return Object.entries(TENANTS).filter(([k]) => !only || k === only).map(([key, brain]) => ({ key, brain }));
}

/* ------------------------------- report ------------------------------- */

function renderReport(r: {
  brain: BrandBrain; locale: Locale; baseline: Baseline;
  baselineMeasured: Map<string, KeywordMetrics>; baselineUsd: number; measureUsd: number;
  result: KeywordResearchResult; aiVolume: Map<string, number | null>;
  kdBucket: (kd: number | null | undefined) => string | null;
}) {
  const L: string[] = [];
  const m = (p: string) => r.baselineMeasured.get(p.toLowerCase());
  const vols = (xs: (number | null | undefined)[]) => xs.map((v) => v ?? 0);
  const picks = r.result.keywords, f = r.result.funnel;

  const bWithVol = r.baseline.filter((b) => (m(b.phrase)?.searchVolume ?? 0) > 0);
  const graded = r.baseline.filter((b) => b.difficulty && m(b.phrase)?.kd != null);
  const agree = graded.filter((b) => r.kdBucket(m(b.phrase)!.kd) === b.difficulty);
  const bVols = vols(r.baseline.map((b) => m(b.phrase)?.searchVolume));
  const pVols = vols(picks.map((p) => p.metrics.searchVolume));
  const fromSource = (s: string) => picks.filter((p) => p.source === s).length;
  const fits = (n: number) => picks.filter((p) => p.fit === n).length;
  const serped = picks.filter((p) => p.serp);

  L.push(`# Keyword research eval: ${r.brain.name}`, "",
    `${r.locale.location_name} / ${r.locale.language_code} · ${new Date().toISOString().slice(0, 10)}`, "",
    "## Scorecard", "",
    "| | Old (Haiku + web search) | New (DataForSEO + Haiku) |", "|---|---|---|",
    `| Keywords | ${r.baseline.length || "skipped"} | ${picks.length} (+ ${sum(picks.map((p) => p.variants.length))} merged variants) |`,
    `| With measurable Google volume | ${r.baseline.length ? `${bWithVol.length} (${pct(bWithVol.length, r.baseline.length)})` : "—"} | ${picks.length} (100%, by construction) |`,
    `| Median monthly volume | ${r.baseline.length ? median(bVols) : "—"} | ${median(pVols)} |`,
    `| Total monthly volume | ${r.baseline.length ? sum(bVols).toLocaleString() : "—"} | ${sum(pVols).toLocaleString()} |`,
    `| Model difficulty matches measured KD | ${graded.length ? `${agree.length}/${graded.length}` : "—"} | measured |`,
    `| Buyer fit (1–5) | — | ${fits(5)}× 5 · ${fits(4)}× 4 · ${fits(3)}× 3 |`,
    `| Where picks came from | web search | ${fromSource("prior")} prior · ${fromSource("seed")} seeds · ${fromSource("trend")} Trends · ${fromSource("idea")} Labs ideas · ${fromSource("competitor")} competitor |`,
    `| Filtering | — | ${f.measured} measured (${f.trendQueries} Trends queries) → ${f.offTopicCompetitor} off-topic competitor dropped → ${f.rated} rated → ${f.rejected} rejected → ${f.merged} merged as variants |`,
    `| Cost | $${r.baselineUsd.toFixed(3)} (+ $${r.measureUsd.toFixed(3)} to measure it) | $${(r.result.costUsdMicros / 1e6).toFixed(3)} |`,
    "");

  if (r.baseline.length) {
    L.push("## Old keywords, measured", "",
      "| Phrase | Bucket | Model difficulty | Volume | KD | Measured difficulty |", "|---|---|---|---|---|---|");
    for (const b of r.baseline) {
      const x = m(b.phrase);
      L.push(`| ${b.phrase} | ${b.bucket} | ${b.difficulty ?? "—"} | ${x?.searchVolume ?? "no data"} | ${x?.kd ?? "—"} | ${r.kdBucket(x?.kd) ?? "—"} |`);
    }
    L.push("");
  }

  L.push("## New keywords, by opportunity score", "",
    "| P | Score | Fit | Phrase | Variants | Bucket | Volume | KD | Intent | Trend | Source | Why |", "|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const p of picks) {
    L.push(`| ${p.priority} | ${p.score} | ${p.fit} | ${p.phrase} | ${p.variants.join(", ") || "—"} | ${p.bucket} | ${p.metrics.searchVolume ?? "—"} | ${p.metrics.kd ?? "—"} | ${p.searchIntent ?? "—"} | ${trendWord(p.metrics.trend)} | ${p.source} | ${p.rationale.replace(/\|/g, "/")} |`);
  }

  L.push("", "## Live results pages (top picks)", "",
    "| Keyword | Format | Why that format | AI Overview | Featured snippet | PAA | Top domains |", "|---|---|---|---|---|---|---|");
  for (const p of serped) {
    const s = p.serp!;
    L.push(`| ${p.phrase} | ${p.format ?? "—"} | ${(p.formatReason ?? "—").replace(/\|/g, "/")} | ${s.aiOverview ? "yes" : "—"} | ${s.featuredSnippet ? "yes" : "—"} | ${s.peopleAlsoAsk.length} | ${s.topDomains.join(", ")} |`);
  }

  if (r.result.peopleAlsoAsk.length) {
    L.push("", "## Real People Also Ask questions", "", "| Question | AI-assistant monthly volume |", "|---|---|");
    for (const q of r.result.peopleAlsoAsk) L.push(`| ${q} | ${r.aiVolume.get(q.toLowerCase()) ?? "—"} |`);
  }

  const formats = [...new Set(serped.map((p) => p.format).filter(Boolean))];
  const summary = [
    `  old: ${r.baseline.length ? `${pct(bWithVol.length, r.baseline.length)} have volume, median vol ${median(bVols)}, $${r.baselineUsd.toFixed(3)}` : "skipped"}`,
    `  new: ${picks.length} keywords (+${f.merged} merged variants), fit ${fits(5)}×5/${fits(4)}×4/${fits(3)}×3, median vol ${median(pVols)}, formats: ${formats.join(", ") || "—"}, $${(r.result.costUsdMicros / 1e6).toFixed(3)}`,
  ].join("\n");
  return { markdown: L.join("\n") + "\n", summary };
}

/* ------------------------------- helpers ------------------------------- */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
/** Compare the last 3 months with the 3 before them. */
function trendWord(t: number[]) {
  if (t.length < 6) return "—";
  const recent = sum(t.slice(-3)), prior = sum(t.slice(-6, -3));
  if (!prior) return recent ? "new" : "—";
  const change = (recent - prior) / prior;
  return change > 0.15 ? `↑ ${Math.round(change * 100)}%` : change < -0.15 ? `↓ ${Math.round(-change * 100)}%` : "flat";
}

main().catch((e) => { console.error(e); process.exit(1); });
