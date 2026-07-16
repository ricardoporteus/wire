/**
 * WIRE — Onboarding wizard step config + shared validation.
 *
 * The Zod schemas here are the single source of per-step validation, used by
 * both the client wizard (inline, on Next) and the server actions (authoritative,
 * on save). They compose the field schemas in `brand-brain.zod.ts` so the wizard
 * and the AI drafter validate against exactly the same shapes.
 */

import { z } from "zod";
import {
  icpSchema, competitorSchema, voiceSchema, vocabularySchema,
  valueSchema, approvedFactSchema, formatRuleSchema, DEFAULT_FORMATS,
} from "@/lib/brand-brain.zod";

/* ------------------------------- step schemas ----------------------------- */

export const companyStepSchema = z.object({
  whatTheyDo: z.string().min(20, "Two or three sentences on what the company does."),
  differentiator: z.string().optional(),
  icp: icpSchema,
});

export const competitorsStepSchema = z.object({
  competitors: z.array(competitorSchema).min(3, "Add at least 3 competitors.").max(8),
});

export const voiceStepSchema = z.object({
  voice: voiceSchema,
  vocabulary: vocabularySchema,
});

export const valuesStepSchema = z.object({
  values: z.array(valueSchema).min(1).max(6),
  approvedFacts: z.array(approvedFactSchema).default([]),
  ethicsRules: z.array(z.string()).default([]),
});

export const formatsStepSchema = z.object({
  formats: z.array(formatRuleSchema).min(1, "Keep at least one format enabled."),
});

/** step key → schema, for the server `saveStep` action */
export const STEP_SCHEMAS = {
  company: companyStepSchema,
  competitors: competitorsStepSchema,
  voice: voiceStepSchema,
  values: valuesStepSchema,
  formats: formatsStepSchema,
} as const;

export type StepKey = keyof typeof STEP_SCHEMAS;

/* ------------------------------ step metadata ----------------------------- */

export type StepMeta = {
  key: "site" | StepKey | "review";
  title: string;
  blurb: string;
  optional: boolean; // steps 4 & 5 have sane defaults
};

export const STEPS: StepMeta[] = [
  { key: "site",        title: "Site scan",          blurb: "Point Wire at your site and let it draft everything.", optional: false },
  { key: "company",     title: "Company & ICP",      blurb: "Who you are and who you're writing for.",             optional: false },
  { key: "competitors", title: "Competitors",        blurb: "The 3–8 sites your intelligence runs watch.",         optional: false },
  { key: "voice",       title: "Voice & vocabulary", blurb: "How Wire sounds, and the words it must and mustn't use.", optional: false },
  { key: "values",      title: "Values & facts",     blurb: "What every piece must reflect, and the only claims it may state.", optional: true },
  { key: "formats",     title: "Formats",            blurb: "Which formats are on, and their length rules.",       optional: true },
  { key: "review",      title: "Review",             blurb: "How Wire will write for you.",                        optional: false },
];

/* ------------------------------ seed defaults ----------------------------- */

export const COPY_PRINCIPLE_OPTIONS = [
  "Use active voice",
  "Lead with the point",
  'Speak to "you"',
  "No clichés or filler",
  "Short sentences over long",
  "Show, don't tell",
];
export const DEFAULT_PRINCIPLES = COPY_PRINCIPLE_OPTIONS.slice(0, 4);

export const ETHICS_OPTIONS = [
  "Celebrate diversity; never stereotype or discriminate.",
  "Honest and never misleading — no exaggerated claims.",
  "Only state company claims present in approved facts.",
  "No unverified statistics or invented sources.",
];
export const DEFAULT_ETHICS = ETHICS_OPTIONS.slice(0, 3);

export { DEFAULT_FORMATS };

/* ------------------------------ working draft ----------------------------- */

/**
 * The wizard's in-progress working state. Looser than `brandBrainSchema`:
 * strings may be empty and arrays short while the user is still editing —
 * the strict schemas only gate on Next / Approve.
 */
export type WizardDraft = {
  name: string;
  siteUrl: string;
  whatTheyDo: string;
  differentiator: string;
  icp: {
    who: string;
    segments: string[];
    geographies: string[];
    painPoints: string[];
    searchBehaviour: string;
    emotionalJourney?: string;
  };
  competitors: { url: string; name?: string; note?: string }[];
  voice: {
    pillars: { name: string; description: string }[];
    personality: { is: string; notBut: string }[];
    principles: string[];
    locale: string;
    headlineStyle?: string;
  };
  vocabulary: {
    preferredVerbs: string[];
    preferredNouns: string[];
    preferredAdjectives: string[];
    terminology: { use: string; never: string[] }[];
    banned: string[];
  };
  values: { name: string; description: string }[];
  approvedFacts: { topic: string; fact: string }[];
  ethicsRules: string[];
  formats: { format: string; minWords: number; maxWords: number; structureNotes: string }[];
};

/** A blank brain row's editable fields, seeded with sane defaults. */
export function emptyDraft(name = "", siteUrl = ""): WizardDraft {
  return {
    name,
    siteUrl,
    whatTheyDo: "",
    differentiator: "",
    icp: { who: "", segments: [], geographies: [], painPoints: [], searchBehaviour: "", emotionalJourney: "" },
    competitors: [],
    voice: { pillars: [], personality: [], principles: [...DEFAULT_PRINCIPLES], locale: "en-US", headlineStyle: "" },
    vocabulary: { preferredVerbs: [], preferredNouns: [], preferredAdjectives: [], terminology: [], banned: [] },
    values: [],
    approvedFacts: [],
    ethicsRules: [...DEFAULT_ETHICS],
    formats: DEFAULT_FORMATS.map((f) => ({ ...f })),
  };
}

/** Normalize a `brand_brains` row (jsonb columns may be null) into a WizardDraft. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function draftFromRow(row: any): WizardDraft {
  const base = emptyDraft(row.name ?? "", row.siteUrl ?? "");
  return {
    ...base,
    name: row.name ?? "",
    siteUrl: row.siteUrl ?? "",
    whatTheyDo: row.whatTheyDo ?? "",
    differentiator: row.differentiator ?? "",
    icp: { ...base.icp, ...(row.icp ?? {}) },
    competitors: row.competitors ?? [],
    voice: { ...base.voice, ...(row.voice ?? {}) },
    vocabulary: { ...base.vocabulary, ...(row.vocabulary ?? {}) },
    values: row.values ?? [],
    approvedFacts: row.approvedFacts ?? [],
    ethicsRules: row.ethicsRules?.length ? row.ethicsRules : base.ethicsRules,
    formats: row.formats?.length ? row.formats : base.formats,
  };
}
