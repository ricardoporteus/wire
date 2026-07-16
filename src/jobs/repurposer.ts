/**
 * WIRE — Repurposer (Tool 3)
 * One finished document → every channel format in one pack (5 credits).
 * Each export kind has its own compact spec; all generated in a single call
 * to keep cost and voice-drift down, then split into `exports` rows.
 */

import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { documents, exports as exportsTable } from "@/db/schema";
import { brandBrainSchema, type BrandBrain } from "@/lib/brand-brain.zod";
import { brandBrains } from "@/db/schema";
import { debitCredits, recordUsage } from "@/lib/credits";
import { generateJson } from "./content-writer-pipeline";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const EXPORT_SPECS: Record<string, string> = {
  linkedin_article: "LinkedIn article: 600–900 words. Rework the piece for a professional feed — sharper opening hook (first 2 lines decide the click-through on 'see more'), shorter paragraphs (1–3 sentences), one clear takeaway per section, end with a discussion question. No hashtag walls; 3 hashtags max at the end.",
  linkedin_post: "Condensed LinkedIn post: 120–220 words. One idea from the piece, not a summary of all of it. Hook line → 3–5 short beats → payoff line → question or soft CTA. Line breaks between beats. 3 hashtags max.",
  x_caption: "X post: under 280 characters. The single sharpest claim or stat from the piece, phrased to stand alone. No hashtags unless one is genuinely native to the topic.",
  instagram_caption: "Instagram caption: 80–150 words. Lead with the emotional core, conversational voice, short lines, end with a question. Up to 5 relevant hashtags on a separate final line.",
  facebook_caption: "Facebook caption: 60–120 words. Warm, plain-spoken, link-forward — written to earn the click to the full piece.",
  newsletter_block: "Email newsletter block: 100–160 words. A subject-line suggestion (under 50 chars), then a teaser block that sets up the piece and ends with a 'Read the full piece' CTA line.",
};

const packSchema = z.object({
  items: z.array(z.object({
    kind: z.string(),
    content: z.string().min(20),
  })).min(1),
});

const REPURPOSE_SYSTEM = (brain: BrandBrain) => `You are Wire's repurposer for ${brain.name}. You adapt one finished piece into channel-native formats without losing the brand voice.

Voice pillars: ${brain.voice.pillars.map((p) => p.name).join(" / ")}.
Personality: ${brain.voice.personality.map((p) => `${p.is} not ${p.notBut}`).join("; ")}.
Locale: ${brain.voice.locale}. Terminology rules apply exactly as in the source piece.

Rules:
1. The piece inside <document> is the only source of claims — add nothing, invent nothing.
2. Channel-native means rewritten for the channel, not truncated.
3. Respond with a single JSON object: { "items": [{ "kind", "content" }] } — one item per requested kind, kinds verbatim. No preamble, no fences.`;

export const repurposeDocument = inngest.createFunction(
  { id: "document-repurpose", retries: 1 },
  { event: "wire/document.repurpose.requested" },
  async ({ event, step }) => {
    const { documentId, orgId, kinds } = event.data as {
      documentId: string; orgId: string; kinds: (keyof typeof EXPORT_SPECS)[];
    };

    const doc = await step.run("load", () =>
      db.query.documents.findFirst({ where: eq(documents.id, documentId) }));
    if (!doc?.bodyMarkdown) throw new Error("Nothing to repurpose — generate the piece first");
    const bodyMarkdown = doc.bodyMarkdown; // narrowed here; keep it across the step closure below

    const brainRow = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, doc.brainId) });
    const brain = brandBrainSchema.parse(brainRow);

    await step.run("debit", () =>
      debitCredits({ orgId, brainId: doc.brainId, reason: "repurpose", refType: "export", refId: documentId }));

    const pack = await step.run("repurpose", () =>
      generateJson({
        system: REPURPOSE_SYSTEM(brain),
        userContent: [
          `Requested kinds and their specs:`,
          ...kinds.map((k) => `- ${k}: ${EXPORT_SPECS[k]}`),
          `\n<document title="${doc.title}">\n${bodyMarkdown.slice(0, 30_000)}\n</document>`,
          `\nProduce the pack.`,
        ].join("\n"),
        schema: packSchema,
        maxTokens: 4000,
      }));

    await step.run("save", async () => {
      for (const item of pack.data.items) {
        await db.insert(exportsTable).values({
          documentId, kind: item.kind as never, content: item.content,
        });
      }
    });

    await step.run("telemetry", () =>
      recordUsage({
        orgId, brainId: doc.brainId, refType: "export", refId: documentId,
        tokensIn: pack.usage.input_tokens, tokensOut: pack.usage.output_tokens,
        costUsdMicros: Math.round(pack.usage.input_tokens * 3 + pack.usage.output_tokens * 15),
      }));

    return { ok: true, kinds: pack.data.items.map((i) => i.kind) };
  },
);

/* markdown / html / docx exports are deterministic renders in the app layer
   (remark → html; docx via the docx package) — no AI call, no credits. */
