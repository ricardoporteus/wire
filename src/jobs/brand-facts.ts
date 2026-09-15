/**
 * Brand-fact grounding — keep the Brand Brain's approved facts true to the live
 * site.
 *
 * The writer only states specifics that appear in its approved facts or the
 * source. If those facts are stale (an old price, a program renamed, an award
 * reworded) the writer confidently ships the stale version. This job reads the
 * brand's live pages and rebuilds the approved-fact list from what the site
 * actually says today, so correct specifics are available at write time rather
 * than only caught after the fact by the checker.
 *
 * Opus + web_search, same tool the research and fact-check passes use.
 */
import Anthropic from "@anthropic-ai/sdk";
import { eq, sql } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { db } from "@/lib/db";
import { brandBrains } from "@/db/schema";
import { inngest } from "@/lib/inngest";
import type { BrandBrain } from "@/lib/brand-brain.zod";

const anthropic = new Anthropic();
const MODEL = "claude-opus-4-8";
const MAX_SEARCHES = 10;
const WEB_SEARCH_USD = 0.01;
const OPUS_IN_MICROS = 5, OPUS_OUT_MICROS = 25;

export type ApprovedFact = { topic: string; fact: string };
export type RefreshResult = {
  facts: ApprovedFact[];
  notes: string[];            // claims the site does NOT support (dropped/softened)
  tokensIn: number; tokensOut: number; costUsdMicros: number;
};

const SHAPE = `{"facts":[{"topic":"short label, e.g. 'Sintra pricing' or 'Age range'","fact":"one specific, self-contained sentence a writer can state verbatim"}],"notes":["any claim you could NOT confirm on the site, or that the site contradicts, so it is left out"]}`;

const SYSTEM = (brain: BrandBrain) => `You are Mavrix's brand-fact researcher for ${brain.name}. Build the list of specific, verifiable facts a content writer is allowed to state about this brand, taken ONLY from the brand's own live website.

Brand: ${brain.name} — ${brain.whatTheyDo}
Website: ${brain.siteUrl}

Method:
1. Use web_search to read the brand's own pages: the pricing page, the product/education/service pages, the destinations or locations pages, the about page, and the press page. Read the live pages, not third-party summaries.
2. Extract the specifics a writer needs and would otherwise invent:
   - Prices and fees, WITH their context (which destination, program, cohort, and dates each price applies to). Never state a price without saying what it is for. If pricing varies by destination, capture each destination's figures separately.
   - Program and product names exactly as the site spells them.
   - Age ranges, schedules/hours, and what is included.
   - Discounts and their exact conditions.
   - Awards and press, in the site's own wording (do not upgrade "named to X" into "top 10 of X").
   - Accreditation ONLY if the site literally uses the word "accredited". If it says "inspired by" or "pathway", capture that exact, weaker wording instead.
3. Rules:
   - Every fact must be something you actually saw on the site. If you cannot confirm it, leave it out and add it to "notes".
   - Do NOT carry over claims from general knowledge, and do NOT state superiority ("the only…", "the best…") unless the site explicitly says so.
   - Keep each fact to one specific, self-contained sentence.
   - Aim for the 20-50 facts that matter most to someone writing marketing content.

Return ONLY this JSON shape (no preamble, no fences):
${SHAPE}`;

function parse(text: string): { facts: ApprovedFact[]; notes: string[] } {
  const clean = text.replace(/^```json\s*|```\s*$/g, "").trim();
  const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  let obj = tryParse(clean);
  if (!obj) { const a = clean.indexOf("{"), b = clean.lastIndexOf("}"); if (a !== -1 && b > a) obj = tryParse(clean.slice(a, b + 1)); }
  const facts = Array.isArray(obj?.facts)
    ? obj.facts
        .filter((f: unknown) => f && typeof (f as ApprovedFact).topic === "string" && typeof (f as ApprovedFact).fact === "string")
        .map((f: ApprovedFact) => ({ topic: f.topic.slice(0, 60), fact: f.fact.slice(0, 400) }))
        .filter((f: ApprovedFact) => f.topic.length >= 2 && f.fact.length >= 5)
        .slice(0, 60)
    : [];
  const notes = Array.isArray(obj?.notes) ? obj.notes.filter((n: unknown) => typeof n === "string").slice(0, 20) : [];
  return { facts, notes };
}

export async function refreshBrandFacts(opts: {
  brain: BrandBrain;
  onSearch?: (query: string) => void;
}): Promise<RefreshResult> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Research ${opts.brain.name}'s live website (${opts.brain.siteUrl}) and return the approved-fact list now.` },
  ];
  let tokensIn = 0, tokensOut = 0, costUsdMicros = 0;
  const maxTurns = MAX_SEARCHES + 3;

  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM(opts.brain),
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }],
      messages,
    });
    const u = res.usage;
    tokensIn += u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    tokensOut += u.output_tokens;
    costUsdMicros += res.content.filter((b) => b.type === "server_tool_use").length * Math.round(WEB_SEARCH_USD * 1e6);
    costUsdMicros += u.input_tokens * OPUS_IN_MICROS + u.output_tokens * OPUS_OUT_MICROS;

    if (opts.onSearch) {
      for (const b of res.content) {
        const bb = b as { type: string; name?: string; input?: { query?: string } };
        if (bb.type === "server_tool_use" && bb.name === "web_search" && bb.input?.query) opts.onSearch(String(bb.input.query).slice(0, 140));
      }
    }

    if (res.stop_reason !== "tool_use") {
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      const { facts, notes } = parse(text);
      return { facts, notes, tokensIn, tokensOut, costUsdMicros };
    }
    messages.push({ role: "assistant", content: res.content });
  }
  return { facts: [], notes: ["Fact refresh ran out of search budget before completing."], tokensIn, tokensOut, costUsdMicros };
}

/* ---------------------------- Inngest wiring ------------------------------ */

/**
 * Refresh one brain's approved facts from its live site and persist them.
 * Triggered on demand from Settings ("Refresh facts from live site") and by the
 * monthly cron below. Not credit-gated: keeping facts true is platform-side
 * maintenance (~$0.10 a run), and a stale price is exactly what we are fixing.
 *
 * The whole web-search loop runs inside a single step so a retry re-runs the
 * research cleanly rather than resuming a half-finished agent conversation.
 */
export const refreshBrandFactsJob = inngest.createFunction(
  { id: "brand-facts-refresh", retries: 1, concurrency: { key: "event.data.brainId", limit: 1 } },
  { event: "wire/brand-facts.refresh.requested" },
  async ({ event, step }) => {
    const { brainId } = event.data as { brainId: string };

    const brain = await step.run("load-brain", async () => {
      const row = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, brainId) });
      if (!row) throw new NonRetriableError("Brain not found");
      return row;
    });

    const result = await step.run("refresh-facts", () =>
      refreshBrandFacts({ brain: brain as unknown as BrandBrain }),
    );

    // Only overwrite when the research actually produced facts — never wipe a
    // good list because a run came back empty (rate limit, timeout, bad parse).
    if (result.facts.length === 0) {
      return { brainId, wrote: 0, notes: result.notes, skipped: "no_facts_returned" };
    }

    await step.run("save-facts", () =>
      db.update(brandBrains)
        .set({ approvedFacts: result.facts, updatedAt: new Date() })
        .where(eq(brandBrains.id, brainId)),
    );

    return {
      brainId,
      wrote: result.facts.length,
      notes: result.notes,
      costUsd: result.costUsdMicros / 1e6,
    };
  },
);

/**
 * Monthly cron: refresh every completed brain's facts so prices and programs
 * stay current without anyone remembering to click the button. Fires one event
 * per brain; the job's own concurrency key keeps them from piling up.
 */
export const scheduleBrandFactsRefresh = inngest.createFunction(
  { id: "brand-facts-monthly-cron" },
  { cron: "0 5 1 * *" },
  async ({ step }) => {
    const brains = await step.run("list-completed-brains", () =>
      db.select({ id: brandBrains.id })
        .from(brandBrains)
        .where(sql`${brandBrains.wizardCompletedAt} is not null`),
    );
    if (brains.length === 0) return { enqueued: 0 };
    await step.sendEvent("fan-out", brains.map((b) => ({
      name: "wire/brand-facts.refresh.requested" as const,
      data: { brainId: b.id },
    })));
    return { enqueued: brains.length };
  },
);
