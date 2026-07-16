/**
 * Writer quality gate — the launch pass/fail from the project plan.
 *
 * Runs real generations across the synthetic tenants (tenants.ts) and scores
 * each on two layers:
 *   1. Deterministic checks (free, exact): no em dashes, word count in the
 *      format's range, no banned terms / terminology violations, brief complete,
 *      target keyword present, meta length.
 *   2. An LLM judge (Opus) for the things code can't see: brand-voice adherence,
 *      no hallucinated facts about the brand, on-brand terminology, format fit.
 *
 * A piece passes only if every deterministic check passes AND the judge passes.
 * The gate passes if the pass rate clears the threshold and nothing hallucinated.
 *
 * Run:  npx tsx src/eval/run.ts            (full ~11-task suite)
 *       npx tsx src/eval/run.ts --tasks=2  (cheap smoke run)
 *       npx tsx src/eval/run.ts --threshold=0.9
 */
import { loadEnvFile } from "node:process";
try { loadEnvFile(".env.local"); } catch { /* rely on ambient env */ }

const argNum = (flag: string, dflt: number) => {
  const a = process.argv.find((x) => x.startsWith(`--${flag}=`));
  return a ? Number(a.split("=")[1]) : dflt;
};

const JUDGE_MODEL = "claude-opus-4-8";

type Check = { name: string; pass: boolean; detail?: string };
type Judge = { voice: number; onBrand: boolean; hallucinationFree: boolean; terminologyOk: boolean; formatFit: boolean; verdict: "pass" | "fail"; notes: string };

async function main() {
  // Env must be loaded before these modules initialize (they construct the
  // Anthropic client + DB pool from process.env), hence the dynamic import.
  const pipeline = await import("../jobs/content-writer-pipeline");
  const { TENANTS, TASKS } = await import("./tenants");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const { z } = await import("zod");
  const anthropic = new Anthropic();

  const limit = argNum("tasks", TASKS.length);
  const threshold = argNum("threshold", 0.9);
  const tasks = TASKS.slice(0, limit);

  const judgeSchema = z.object({
    voice: z.number().int().min(1).max(5),
    onBrand: z.boolean(),
    hallucinationFree: z.boolean(),
    terminologyOk: z.boolean(),
    formatFit: z.boolean(),
    verdict: z.enum(["pass", "fail"]),
    notes: z.string(),
  });

  console.log(`\n▶ Writer quality gate — ${tasks.length} generations, threshold ${Math.round(threshold * 100)}%\n`);

  const results: { key: string; checks: Check[]; judge: Judge | null; pass: boolean }[] = [];

  for (const task of tasks) {
    const brain = TENANTS[task.tenant];
    const formatRule = brain.formats.find((f) => f.format === task.format) ?? brain.formats[0];
    const key = `${task.tenant}/${task.format}`;
    process.stdout.write(`  ${key} … `);

    const maxTokens = Math.min(8000, Math.round((formatRule.maxWords ?? 1500) * 1.7) + 1500);
    const userContent = [
      `Confirmed diagnosis:`,
      `Title: ${task.title}`,
      `Core message: ${task.coreMessage}`,
      `Primary keyword: ${task.targetKeyword}`,
      `\n<source>\n${task.source}\n</source>`,
      `\nWrite the ${formatRule.format} now.`,
    ].join("\n");

    let checks: Check[] = [];
    let judge: Judge | null = null;
    try {
      const gen = await pipeline.generateJson({
        system: pipeline.WRITER_SYSTEM(brain, formatRule),
        userContent,
        schema: pipeline.generationSchema,
        maxTokens,
      });
      const title = pipeline.stripEmDashes(gen.data.title);
      const body = pipeline.stripEmDashes(gen.data.bodyMarkdown);
      const brief = gen.data.brief;
      const words = pipeline.countWords(body);
      const intro = body.slice(0, 700).toLowerCase();
      const kw = task.targetKeyword.toLowerCase();

      checks = [
        { name: "no_em_dashes", pass: !(title + body).includes("—") },
        { name: "word_count", pass: words >= formatRule.minWords * 0.7 && words <= formatRule.maxWords * 1.3, detail: `${words} (want ${formatRule.minWords}–${formatRule.maxWords})` },
        { name: "no_banned_terms", pass: pipeline.lintTerminology(body + " " + title, brain).length === 0, detail: pipeline.lintTerminology(body + " " + title, brain).map((v) => v.found).join(", ") || undefined },
        { name: "keyword_present", pass: title.toLowerCase().includes(kw) || intro.includes(kw), detail: kw },
        { name: "meta_length", pass: brief.metaDescription.length >= 80 && brief.metaDescription.length <= 180, detail: `${brief.metaDescription.length} chars` },
        { name: "alt_texts", pass: brief.altTexts.length === 3 },
        { name: "values_reflected", pass: brief.valuesReflected.length >= 2 },
      ];

      const jr = await anthropic.messages.create({
        model: JUDGE_MODEL, max_tokens: 700,
        system: judgeSystem(brain),
        messages: [{ role: "user", content: `Judge this ${task.format} for ${brain.name}.\n\nTITLE: ${title}\n\nBODY:\n${body.slice(0, 12000)}\n\nReturn ONLY the JSON verdict.` }],
      });
      const raw = jr.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").replace(/^```json\s*|```\s*$/g, "").trim();
      judge = judgeSchema.parse(JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)));
    } catch (e) {
      checks = [{ name: "generation", pass: false, detail: (e as Error).message.slice(0, 120) }];
    }

    const detPass = checks.every((c) => c.pass);
    const pass = detPass && judge?.verdict === "pass";
    results.push({ key, checks, judge, pass });
    console.log(pass ? "PASS" : "FAIL");
    for (const c of checks.filter((c) => !c.pass)) console.log(`      ✗ ${c.name}${c.detail ? `: ${c.detail}` : ""}`);
    if (judge && judge.verdict === "fail") console.log(`      ✗ judge (voice ${judge.voice}/5): ${judge.notes}`);
    if (judge && !judge.hallucinationFree) console.log(`      ⚠ possible hallucination flagged`);
  }

  // ── report ─────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const rate = results.length ? passed / results.length : 0;
  const hallucinations = results.filter((r) => r.judge && !r.judge.hallucinationFree).length;

  const failsByCheck = new Map<string, number>();
  for (const r of results) for (const c of r.checks) if (!c.pass) failsByCheck.set(c.name, (failsByCheck.get(c.name) ?? 0) + 1);

  console.log(`\n── Results ──────────────────────────────`);
  console.log(`  ${passed}/${results.length} passed (${Math.round(rate * 100)}%)`);
  if (failsByCheck.size) {
    console.log(`  Failing checks:`);
    for (const [name, n] of [...failsByCheck].sort((a, b) => b[1] - a[1])) console.log(`    ${name}: ${n}`);
  }
  if (hallucinations) console.log(`  ⚠ ${hallucinations} piece(s) flagged for possible hallucination`);

  const gate = rate >= threshold && hallucinations === 0;
  console.log(`\n${gate ? "✅ GATE PASSED" : "❌ GATE FAILED"} (need ≥${Math.round(threshold * 100)}% and zero hallucinations)\n`);
  process.exit(gate ? 0 : 1);
}

function judgeSystem(brain: { name: string; whatTheyDo: string; voice: { pillars: { name: string; description: string }[]; personality: { is: string; notBut: string }[] }; vocabulary: { banned: string[]; terminology: { use: string; never: string[] }[] }; approvedFacts?: { fact: string }[] }): string {
  return `You are a strict content-quality judge for the brand "${brain.name}". Score one generated piece against the brand's standards and return a single JSON object. Be exacting — this is a launch gate.

BRAND: ${brain.name} — ${brain.whatTheyDo}
VOICE PILLARS: ${brain.voice.pillars.map((p) => `${p.name} (${p.description})`).join("; ")}
PERSONALITY: ${brain.voice.personality.map((p) => `${p.is}, not ${p.notBut}`).join("; ")}
BANNED WORDS (must not appear): ${brain.vocabulary.banned.join(", ")}
MANDATORY TERMINOLOGY: ${brain.vocabulary.terminology.map((t) => `use "${t.use}", never ${t.never.map((n) => `"${n}"`).join("/")}`).join("; ")}
APPROVED FACTS (the ONLY specific claims allowed about ${brain.name}):
${(brain.approvedFacts ?? []).map((f) => `- ${f.fact}`).join("\n") || "- (none)"}

Judge on:
- voice (1–5): how well it matches the pillars and personality.
- onBrand: does it read like ${brain.name}, not generic marketing?
- hallucinationFree: does it state NO specific fact about ${brain.name} beyond the approved facts? Any invented metric, feature, or claim = false.
- terminologyOk: banned words absent AND mandatory terminology respected?
- formatFit: does it fit the requested format?
- verdict: "pass" only if voice ≥ 3 AND onBrand AND hallucinationFree AND terminologyOk AND formatFit.
- notes: one sentence, the main issue if any.

Return ONLY: {"voice":n,"onBrand":bool,"hallucinationFree":bool,"terminologyOk":bool,"formatFit":bool,"verdict":"pass"|"fail","notes":"..."}`;
}

main().catch((e) => { console.error(e); process.exit(1); });
