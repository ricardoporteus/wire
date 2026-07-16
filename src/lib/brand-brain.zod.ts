/**
 * WIRE — Brand Brain Zod schemas
 * Single source of validation, used in three places:
 *  1. Wizard forms (client + server actions)
 *  2. The AI drafter — its JSON output MUST parse against `brandBrainDraftSchema`
 *     or the draft is rejected and retried
 *  3. Pipeline entry — a run refuses to start unless the Brain parses complete
 */

import { z } from "zod";

export const icpSchema = z.object({
  who: z.string().min(10),
  segments: z.array(z.string().min(2)).min(1).max(10),
  geographies: z.array(z.string().min(2)).min(1).max(20),
  painPoints: z.array(z.string().min(5)).min(2).max(8),
  searchBehaviour: z.string().min(20),
  emotionalJourney: z.string().optional(),
});

export const competitorSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  note: z.string().optional(),
});

export const voiceSchema = z.object({
  pillars: z.array(z.object({
    name: z.string().min(2),
    description: z.string().min(5),
  })).min(2).max(4),
  personality: z.array(z.object({
    is: z.string().min(2),
    notBut: z.string().min(2),
  })).min(3).max(8),
  principles: z.array(z.string().min(5)).min(3),
  locale: z.string().default("en-US"),
  headlineStyle: z.string().optional(),
});

export const vocabularySchema = z.object({
  preferredVerbs: z.array(z.string()).default([]),
  preferredNouns: z.array(z.string()).default([]),
  preferredAdjectives: z.array(z.string()).default([]),
  terminology: z.array(z.object({
    use: z.string().min(1),
    never: z.array(z.string().min(1)).min(1),
  })).default([]),
  banned: z.array(z.string()).default([]),
});

export const valueSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
});

export const approvedFactSchema = z.object({
  topic: z.string().min(2),
  fact: z.string().min(5),
});

export const formatRuleSchema = z.object({
  format: z.enum(["article", "listicle", "how_to", "lesson", "tutorial", "testimonial", "faq_page"]),
  minWords: z.number().int().min(100),
  maxWords: z.number().int().max(5000),
  structureNotes: z.string(),
});

/** Seeded defaults — carried straight from the proven Boundless skill */
export const DEFAULT_FORMATS = [
  { format: "article",     minWords: 800,  maxWords: 1500, structureNotes: "Hook → context → H2/H3 sections every 200–300 words → FAQ (3–5 Q&A) → CTA. Answer the core question in the first 2–3 sentences." },
  { format: "listicle",    minWords: 600,  maxWords: 1200, structureNotes: "5–15 items, bold subhead each, 2–4 sentences of substance per item — no one-liners." },
  { format: "how_to",      minWords: 1000, maxWords: 2000, structureNotes: "Brief intro → numbered steps with explanation → FAQ → CTA." },
  { format: "lesson",      minWords: 900,  maxWords: 1800, structureNotes: "Learning objective up front → concept in plain terms → worked example → practice/apply section → recap." },
  { format: "tutorial",    minWords: 1000, maxWords: 2200, structureNotes: "Outcome preview → prerequisites → sequential steps with checkpoints → troubleshooting → next steps." },
  { format: "testimonial", minWords: 600,  maxWords: 1000, structureNotes: "Hook with real scenario → the challenge → how it was solved → outcomes and emotional wins → CTA. Specific details (ages, places, moments)." },
  { format: "faq_page",    minWords: 500,  maxWords: 800,  structureNotes: "Brief intro → 8–12 Q&A pairs in H3 → CTA. Each answer snippet-ready." },
] as const;

/** The full Brain as the wizard saves it */
export const brandBrainSchema = z.object({
  name: z.string().min(1),
  siteUrl: z.string().url(),
  whatTheyDo: z.string().min(20),
  differentiator: z.string().optional(),
  icp: icpSchema,
  competitors: z.array(competitorSchema).min(3).max(8),
  voice: voiceSchema,
  vocabulary: vocabularySchema,
  values: z.array(valueSchema).min(1).max(6),
  approvedFacts: z.array(approvedFactSchema).default([]),
  ethicsRules: z.array(z.string()).default([
    "Celebrate diversity; never stereotype or discriminate.",
    "Honest and never misleading — no exaggerated claims.",
    "Only state company claims present in approved facts.",
  ]),
  formats: z.array(formatRuleSchema).min(1),
});

/**
 * The drafter's output — same shape, but competitors may be fewer (site scans
 * often surface 1–2) and every field is best-effort. The wizard fills gaps.
 */
export const brandBrainDraftSchema = brandBrainSchema.partial().extend({
  name: z.string().min(1),
  siteUrl: z.string().url(),
  competitors: z.array(competitorSchema).max(8).default([]),
});

export type BrandBrain = z.infer<typeof brandBrainSchema>;
export type BrandBrainDraft = z.infer<typeof brandBrainDraftSchema>;
