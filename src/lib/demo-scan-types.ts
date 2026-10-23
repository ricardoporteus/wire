/**
 * Shared types for the public "Live Scan" teaser (lib/demo-scan + the db row +
 * the marketing modal). Type-only, no runtime imports, so the schema can embed
 * these as jsonb shapes without a dependency cycle.
 */
import type { BrandBrainDraft } from "@/lib/brand-brain.zod";

export type DemoDifficulty = "low" | "medium" | "high" | null;

export type DemoKeyword = {
  phrase: string;
  volume: number | null;
  kd: number | null;
  difficulty: DemoDifficulty;
  intent: string | null;
  priority: 1 | 2 | 3;
  score: number;
};

export type DemoPageOne = {
  phrase: string;
  aiOverview: boolean;
  peopleAlsoAsk: string[];
  featuredSnippet: boolean;
  recommendedFormat: string;
};

export type DemoBrief = {
  title: string;
  phrase: string;
  volume: number | null;
  priority: 1 | 2 | 3;
};

/** The brand audit the scan surfaces — the reassurance beat. Drawn from the draft. */
export type DemoBrand = {
  name: string;
  whatTheyDo: string;
  differentiator?: string;
  voicePillars: { name: string; description: string }[];
  principles: string[];
  icpWho: string;
  competitors: { url?: string; name?: string; note?: string }[];
  sayWords: string[];
  banWords: string[];
  values: { name: string; description: string }[];
  facts: { topic: string; fact: string }[];
  guardrails: string[];
};

export type DemoScanResult = {
  domain: string;
  brand: DemoBrand;
  keywords: DemoKeyword[];
  pageOne: DemoPageOne[];
  briefs: DemoBrief[];
  counts: { measured: number; kept: number; briefs: number };
  cached?: boolean;
};

/** Streamed event protocol: one NDJSON line per event from /api/demo-scan. */
export type DemoEvent =
  | { t: "token"; token: string }
  | { t: "stage"; stage: string; message?: string }
  | { t: "brandField"; label: string; value: string }
  | { t: "keyword"; row: DemoKeyword }
  | { t: "pageone"; card: DemoPageOne }
  | { t: "audit"; brand: DemoBrand }
  | { t: "brief"; brief: DemoBrief }
  | { t: "counts"; measured: number; kept: number; briefs: number }
  | { t: "done"; token: string; result: DemoScanResult }
  | { t: "error"; message: string };

/** What we persist to adopt on sign-up, kept alongside the render result. */
export type DemoBrainDraft = BrandBrainDraft;
