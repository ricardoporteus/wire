/**
 * Fact-check pass — the accuracy backstop the writer lacked.
 *
 * The writer is a closed-book model: it cannot see the brand's live pages or
 * current-year facts, so it fabricates specifics (invented prices, stale visa
 * law, wrong-destination figures). This pass does what a careful human editor
 * does: pull every specific claim out of the draft, verify each with web search
 * (world facts) and against the brand's own site (brand facts) plus the approved
 * facts, then classify it.
 *
 * Policy (chosen by the product owner): STRIP fabricated and contradicted
 * specifics from the body, and FLAG everything unverifiable in a report — never
 * silently auto-write a "correction" that could itself be wrong.
 *
 * Runs on Opus (the strongest reasoning model) with the same web_search tool the
 * research pipeline uses.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { BrandBrain } from "@/lib/brand-brain.zod";

const anthropic = new Anthropic();
const FACT_CHECK_MODEL = "claude-opus-4-8";
const MAX_SEARCHES = 8;            // bound COGS; a 2500-word piece rarely needs more
const WEB_SEARCH_USD = 0.01;       // Anthropic web-search tool fee per search
// Opus 4.8 list price, micros per token ($5 / $25 per 1M).
const OPUS_IN_MICROS = 5, OPUS_OUT_MICROS = 25;
// The checker MUST see at least as much source as the writer did, or it flags
// legitimately-sourced quotes/anecdotes as "not in the transcript". This cap
// covers multi-hour transcripts in full (~50k tokens); prompt caching keeps the
// per-turn cost of re-sending it down. Keep this >= the writer's source window.
const MAX_SOURCE_CHARS = 200_000;
const MAX_DRAFT_CHARS = 40_000;

export type FactVerdict = "supported" | "fabricated" | "contradicted" | "unverified";
export type FactClaim = {
  claim: string;                   // the specific as it appears in the draft
  type: "price" | "number" | "percent" | "date" | "law" | "feature" | "comparison" | "superiority" | "other";
  verdict: FactVerdict;
  note?: string;                   // why, and the correct value if known
};
export type FactCheckResult = {
  claims: FactClaim[];
  tokensIn: number;
  tokensOut: number;
  costUsdMicros: number;
};

/** Verdicts whose specific should be removed from the body (not just flagged). */
export const STRIP_VERDICTS: FactVerdict[] = ["fabricated", "contradicted"];

const CLAIM_SHAPE = `{"claims":[{"claim":"the specific as written in the draft","type":"price|number|percent|date|law|feature|comparison|superiority|other","verdict":"supported|fabricated|contradicted|unverified","note":"one sentence: the evidence, and the correct value if you found it"}]}`;

const SYSTEM = (brain: BrandBrain) => `You are Mavrix's fact-checker for ${brain.name}. You are given a DRAFT article, the SOURCE material the writer was given, and APPROVED FACTS (pre-verified brand claims). Your job is to catch fabricated and outdated specifics before the piece is published.

Brand site: ${brain.siteUrl}

You have the COMPLETE source material below — it is the full text the writer worked from, not an excerpt or a sample. Never assume the source is truncated or "cuts off"; if something is not in it, it is genuinely absent. Read the WHOLE source before judging any claim against it.

Method:
1. Pull out EVERY specific, checkable claim in the draft: prices and money amounts, numbers and counts, percentages, dates and timeframes, legal/visa/regulatory facts, named product features or programs, direct quotes and personal anecdotes attributed to people, and any comparison or superiority claim ("the only…", "the best…", "accredited…").
2. Decide what each claim must be checked against, then check it there:
   - SOURCE claims — direct quotes, personal anecdotes and stories, and the names, ages, schedules, timelines and experiences of the people in the source: verify against the SOURCE material, reading all of it. A published write-up condenses and lightly rewords a transcript, so a quote or anecdote is "supported" whenever its substance clearly appears somewhere in the source, even if the draft tightens the wording, cleans up filler, or merges two nearby lines. Mark it "fabricated" ONLY if the substance is genuinely absent from the entire source. Do NOT use web_search for personal quotes or anecdotes, and never mark one "unverified" for lack of a web result — the source is the sole authority for them.
   - Brand facts (prices, hours, ages, program names, awards): check ${brain.siteUrl} and its pricing/product/press pages with web_search. The brand's OWN live site is the source of truth, over the draft, the approved facts, AND any third-party page.
   - World facts (visa law, tax thresholds, regulations, statistics): search for the current-year position. Laws change; do not trust the draft's own dates.
3. Brand-authority rule — this is the most important rule, apply it strictly:
   For claims ABOUT THE BRAND ITSELF — accreditation/certification ("accredited", "certified", "WASC", "IB", "authorized"), awards/recognition, partnerships, superiority ("the only", "the best", "leading", "#1"), and named features/capabilities — the ONLY acceptable confirmation is the brand's OWN site or the APPROVED FACTS. A third-party page (Crunchbase, a blog, a directory, a press aggregator, a review site) does NOT make a brand claim "supported", no matter how many you find.
   - If the brand's own site (or the approved facts) uses WEAKER wording than the draft (e.g. draft says "accredited" but the site says "inspired by", "pathway", "aligned to", "Finnish-inspired"; or draft says "the best/only" but the site does not claim it), mark the draft's claim "contradicted" and put the site's actual, weaker wording in the note. Do NOT rescue it with a third-party source.
   - If neither the brand site nor the approved facts state the brand claim at all, it is "fabricated" (or "unverified" only if the site plainly could state it but you genuinely could not reach the relevant page).
4. Classify each claim:
   - "supported": it appears in SOURCE, in APPROVED FACTS, or — for non-brand world facts — you confirmed it by search. For BRAND claims, only the brand's own site or approved facts count (see rule 3).
   - "fabricated": a specific that appears in NONE of source, approved facts, or (for world facts) the web — the writer invented it.
   - "contradicted": you found evidence it is WRONG, out of date, or overstated versus the brand's own wording (give the correct/weaker value in the note).
   - "unverified": genuinely checkable but you could not confirm or refute it.
   Be strict. If a price or number is not literally in the source/approved facts and you cannot confirm it on the web, it is "fabricated", not "unverified".

Return ONLY this JSON shape (no preamble, no fences):
${CLAIM_SHAPE}`;

function parseClaims(text: string): FactClaim[] {
  const clean = text.replace(/^```json\s*|```\s*$/g, "").trim();
  const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  let obj = tryParse(clean);
  if (!obj) {
    const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
    if (a !== -1 && b > a) obj = tryParse(clean.slice(a, b + 1));
  }
  const claims = obj?.claims;
  if (!Array.isArray(claims)) return [];
  const VERDICTS = new Set(["supported", "fabricated", "contradicted", "unverified"]);
  return claims
    .filter((c) => c && typeof c.claim === "string" && VERDICTS.has(c.verdict))
    .map((c) => ({
      claim: String(c.claim).slice(0, 300),
      type: String(c.type ?? "other") as FactClaim["type"],
      verdict: c.verdict as FactVerdict,
      note: c.note ? String(c.note).slice(0, 400) : undefined,
    }));
}

/**
 * Run the web-grounded verification. Agentic loop: the model searches, reads,
 * and finally emits the claims JSON. Mirrors the research pipeline's loop.
 */
export async function factCheck(opts: {
  brain: BrandBrain;
  title: string;
  body: string;
  source: string | null;
  onSearch?: (query: string) => void;
}): Promise<FactCheckResult> {
  // The whole stable prefix (approved facts + full source + draft) is sent on
  // every turn of the agent loop, so mark it cached: the model re-reads it from
  // cache at ~10% cost instead of paying full input for the large transcript
  // each turn.
  const userText = [
    `APPROVED FACTS:\n${opts.brain.approvedFacts?.map((f) => `- [${f.topic}] ${f.fact}`).join("\n") || "(none)"}`,
    `\nSOURCE (the complete material the writer worked from — read all of it):\n${opts.source?.slice(0, MAX_SOURCE_CHARS) || "(none — the writer had only a brief)"}`,
    `\nDRAFT:\nTitle: ${opts.title}\n\n${opts.body.slice(0, MAX_DRAFT_CHARS)}`,
    `\nCheck every specific claim now, then return the claims JSON.`,
  ].join("\n");
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: [{ type: "text", text: userText, cache_control: { type: "ephemeral" } }] },
  ];

  let tokensIn = 0, tokensOut = 0, costUsdMicros = 0;
  const maxTurns = MAX_SEARCHES + 3;

  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await anthropic.messages.create({
      model: FACT_CHECK_MODEL,
      max_tokens: 6000,
      system: [{ type: "text", text: SYSTEM(opts.brain), cache_control: { type: "ephemeral" } }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }],
      messages,
    });
    const u = res.usage;
    tokensIn += u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    tokensOut += u.output_tokens;
    const searches = res.content.filter((b) => b.type === "server_tool_use").length;
    costUsdMicros += Math.round(searches * WEB_SEARCH_USD * 1_000_000);
    costUsdMicros += u.input_tokens * OPUS_IN_MICROS + u.output_tokens * OPUS_OUT_MICROS;

    if (opts.onSearch) {
      for (const b of res.content) {
        const bb = b as { type: string; name?: string; input?: { query?: string } };
        if (bb.type === "server_tool_use" && bb.name === "web_search" && bb.input?.query) {
          opts.onSearch(String(bb.input.query).slice(0, 140));
        }
      }
    }

    if (res.stop_reason !== "tool_use") {
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text).join("");
      return { claims: parseClaims(text), tokensIn, tokensOut, costUsdMicros };
    }
    messages.push({ role: "assistant", content: res.content });
  }
  // Ran out of turns mid-search — return nothing rather than a partial verdict.
  return { claims: [], tokensIn, tokensOut, costUsdMicros };
}

/**
 * Revision pass: rewrite the draft to REMOVE the flagged specifics (fabricated
 * and contradicted), generalising the sentence rather than inventing a
 * replacement. Uses the writer model. Returns the cleaned title/body. If there
 * is nothing to strip, returns the input untouched (no model call).
 */
export async function stripClaims(opts: {
  model: string;
  title: string;
  body: string;
  toStrip: FactClaim[];
}): Promise<{ title: string; body: string; tokensIn: number; tokensOut: number }> {
  if (opts.toStrip.length === 0) {
    return { title: opts.title, body: opts.body, tokensIn: 0, tokensOut: 0 };
  }
  const list = opts.toStrip.map((c, i) => `${i + 1}. ${c.claim}${c.note ? ` — (${c.note})` : ""}`).join("\n");
  const res = await anthropic.messages.create({
    model: opts.model,
    max_tokens: 8000,
    system: `You are editing an article to remove unverified specific claims. You will be given the article and a numbered list of specific claims that could NOT be verified. For each, edit the sentence so the specific is gone: remove the exact figure/date/claim and rephrase generally (e.g. "from €1,800 per month" becomes "with pricing that varies by destination and season"; "citizenship after five years" becomes "a long-term path to citizenship"; "the only end-to-end operator" becomes "an end-to-end operator"). Do NOT invent replacement numbers. Do NOT change anything else — keep every other word, the structure, the voice, and the length. Never use em dashes. Return ONLY a JSON object: {"title":"...","bodyMarkdown":"..."} with the fully edited article. No preamble, no fences.`,
    messages: [{ role: "user", content: `CLAIMS TO REMOVE:\n${list}\n\nARTICLE:\nTitle: ${opts.title}\n\n${opts.body}` }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  const clean = text.replace(/^```json\s*|```\s*$/g, "").trim();
  try {
    const j = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
    if (typeof j.title === "string" && typeof j.bodyMarkdown === "string" && j.bodyMarkdown.length > 200) {
      return { title: j.title, body: j.bodyMarkdown, tokensIn: res.usage.input_tokens, tokensOut: res.usage.output_tokens };
    }
  } catch { /* fall through */ }
  // If the rewrite failed to parse, keep the original body rather than lose it;
  // the flags still surface in the report so the human can act.
  return { title: opts.title, body: opts.body, tokensIn: res.usage.input_tokens, tokensOut: res.usage.output_tokens };
}
