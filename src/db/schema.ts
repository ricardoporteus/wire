/**
 * WIRE — Drizzle schema v1 (Neon Postgres)
 *
 * Tenancy model: one Clerk Organization = one customer. Plan + seat gating
 * lives in Clerk Billing (`has({ plan })`); this database owns everything
 * Clerk can't do — above all the usage ledger, since Clerk Billing has no
 * native usage metering.
 *
 * The Brand Brain is the keystone: both agent pipelines (intelligence + writer)
 * read it at runtime. Its fields are the direct generalization of everything
 * hard-coded in the Boundless `seo-researcher` and `content-writer` skills.
 */

import {
  pgTable, pgEnum, text, varchar, integer, timestamp, jsonb, boolean,
  uuid, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */

export const runStatus = pgEnum("run_status", [
  "queued", "researching_keywords", "analyzing_competitors", "finding_gaps",
  "finding_aeo", "compiling", "complete", "failed",
]);

export const runTrigger = pgEnum("run_trigger", ["onboarding", "scheduled", "on_demand"]);

export const ideaStatus = pgEnum("idea_status", [
  "suggested", "queued", "drafting", "in_review", "published", "dismissed",
]);

export const sourceKind = pgEnum("source_kind", [
  "pasted_text", "file_upload", "web_url", "audio_link", "video_link", "voice_note",
]);

export const sourceStatus = pgEnum("source_status", [
  "pending", "fetching", "transcribing", "ready", "failed",
]);

export const docFormat = pgEnum("doc_format", [
  "article", "listicle", "how_to", "lesson", "tutorial", "testimonial", "faq_page",
]);

export const docStatus = pgEnum("doc_status", [
  "diagnosing", "awaiting_confirm", "generating", "draft", "final", "archived",
]);

export const exportKind = pgEnum("export_kind", [
  "linkedin_article", "linkedin_post", "x_caption", "instagram_caption",
  "facebook_caption", "newsletter_block", "markdown", "html", "docx",
]);

export const ledgerReason = pgEnum("ledger_reason", [
  "intelligence_run", "diagnosis", "generation", "regeneration",
  "repurpose", "top_up", "plan_grant", "adjustment",
]);

/* ------------------------------ organizations ----------------------------- */
/** Mirror of the Clerk Organization — synced by webhook, never authored here. */
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkOrgId: varchar("clerk_org_id", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  planSlug: varchar("plan_slug", { length: 32 }).notNull().default("trial"), // trial | launch | growth | scale
  creditsBalance: integer("credits_balance").notNull().default(0), // denormalized; ledger is source of truth
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------- brand brains ---------------------------- */
export const brandBrains = pgTable("brand_brains", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                       // brand name as used in copy
  siteUrl: text("site_url").notNull(),
  whatTheyDo: text("what_they_do").notNull(),          // 2–3 sentence company description
  differentiator: text("differentiator"),

  /** ICP — generalizes the skill's "who / income / profile / states / pains / search behaviour" */
  icp: jsonb("icp").$type<{
    who: string;                    // "US families, parents 40–55, kids 2–14"
    segments: string[];             // profile types
    geographies: string[];          // countries / states / cities
    painPoints: string[];
    searchBehaviour: string;        // how they phrase searches
    emotionalJourney?: string;      // fears/desires that shape angle
  }>().notNull(),

  /** Competitor URLs (3–8) — drives the intelligence run */
  competitors: jsonb("competitors").$type<{ url: string; name?: string; note?: string }[]>().notNull(),

  /** Voice — generalizes tone pillars + personality contrasts + copy principles */
  voice: jsonb("voice").$type<{
    pillars: { name: string; description: string }[];        // e.g. Inspiring / Personal / Informative
    personality: { is: string; notBut: string }[];           // "confident" / "arrogant"
    principles: string[];                                    // active voice, no clichés, lead with the point…
    locale: string;                                          // "en-US", "en-GB"…
    headlineStyle?: string;
  }>().notNull(),

  /** Vocabulary — approved words + the mandatory use-this/never-this table */
  vocabulary: jsonb("vocabulary").$type<{
    preferredVerbs: string[];
    preferredNouns: string[];
    preferredAdjectives: string[];
    terminology: { use: string; never: string[] }[];         // enforced at generation + lint pass
    banned: string[];
  }>().notNull(),

  /** Values + approved facts + ethics — content must reflect ≥2 values; facts are citable claims */
  values: jsonb("values").$type<{ name: string; description: string }[]>().notNull(),
  approvedFacts: jsonb("approved_facts").$type<{ topic: string; fact: string }[]>().default([]),
  ethicsRules: jsonb("ethics_rules").$type<string[]>().default([]),

  /** Formats enabled for this brand, with length rules (defaults seeded from the skill) */
  formats: jsonb("formats").$type<{
    format: string; minWords: number; maxWords: number; structureNotes: string;
  }[]>().notNull(),

  wizardCompletedAt: timestamp("wizard_completed_at", { withTimezone: true }),
  aiDraftedAt: timestamp("ai_drafted_at", { withTimezone: true }), // when "draft it for me" ran
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("brand_brains_org_idx").on(t.orgId)]);

/* ----------------------------- intelligence runs -------------------------- */
export const intelligenceRuns = pgTable("intelligence_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  brainId: uuid("brain_id").notNull().references(() => brandBrains.id, { onDelete: "cascade" }),
  trigger: runTrigger("trigger").notNull(),
  status: runStatus("status").notNull().default("queued"),
  inngestRunId: varchar("inngest_run_id", { length: 128 }),
  /** structured report sections not broken out into keyword/idea rows */
  competitorIntel: jsonb("competitor_intel").$type<{
    competitor: string; topics: string[]; targetKeywords: string[]; weakness: string;
  }[]>(),
  trends: jsonb("trends").$type<{ trend: string; opportunity: string }[]>(),
  bestPractices: jsonb("best_practices").$type<string[]>(),
  error: text("error"),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("runs_brain_idx").on(t.brainId)]);

/* --------------------------------- keywords ------------------------------- */
export const keywords = pgTable("keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  brainId: uuid("brain_id").notNull().references(() => brandBrains.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => intelligenceRuns.id, { onDelete: "set null" }),
  phrase: text("phrase").notNull(),
  intent: varchar("intent", { length: 24 }).notNull(),      // high_intent | informational | long_tail | aeo_question
  difficulty: varchar("difficulty", { length: 12 }),        // high | medium | low
  priority: integer("priority").notNull().default(3),       // 1 = red-hot
  rationale: text("rationale"),
  aeoFormat: varchar("aeo_format", { length: 24 }),         // paragraph | list | table (snippet target)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("keywords_brain_idx").on(t.brainId),
  uniqueIndex("keywords_brain_phrase_uq").on(t.brainId, t.phrase),
]);

/* -------------------------------- content ideas --------------------------- */
export const contentIdeas = pgTable("content_ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  brainId: uuid("brain_id").notNull().references(() => brandBrains.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => intelligenceRuns.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  format: docFormat("format").notNull(),
  targetKeywordId: uuid("target_keyword_id").references(() => keywords.id, { onDelete: "set null" }),
  targetAeoQuestion: text("target_aeo_question"),
  whyNow: text("why_now"),
  rank: integer("rank").notNull().default(99),               // position in this month's queue
  status: ideaStatus("status").notNull().default("suggested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ideas_brain_idx").on(t.brainId)]);

/* ---------------------------------- sources ------------------------------- */
export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  brainId: uuid("brain_id").notNull().references(() => brandBrains.id, { onDelete: "cascade" }),
  kind: sourceKind("kind").notNull(),
  status: sourceStatus("status").notNull().default("pending"),
  originalUrl: text("original_url"),
  fileKey: text("file_key"),                                  // blob storage key for uploads
  normalizedText: text("normalized_text"),                    // the single truth the writer reads
  meta: jsonb("meta").$type<{ durationSec?: number; pageCount?: number; wordCount?: number; title?: string }>(),
  error: text("error"),
  createdByClerkUserId: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sources_brain_idx").on(t.brainId)]);

/* --------------------------------- documents ------------------------------ */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  brainId: uuid("brain_id").notNull().references(() => brandBrains.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  ideaId: uuid("idea_id").references(() => contentIdeas.id, { onDelete: "set null" }),
  format: docFormat("format").notNull(),
  status: docStatus("status").notNull().default("diagnosing"),

  /** Phase 1 — the diagnosis card shown before writing */
  diagnosis: jsonb("diagnosis").$type<{
    coreMessage: string;
    recommendedTitle: string;
    targetKeyword?: string;
    targetAeoQuestion?: string;
    whyThisFormat: string;
    alternative?: { title: string; format: string; why: string };
  }>(),

  title: text("title"),
  bodyMarkdown: text("body_markdown"),

  /** The content brief appended to every finished piece */
  brief: jsonb("brief").$type<{
    wordCount: number;
    primaryKeyword?: string;
    secondaryKeywords: string[];
    targetAeoQuestion?: string;
    metaDescription: string;
    altTexts: string[];
    valuesReflected: string[];
    terminologyCheckPassed: boolean;
    voiceChecksPassed: boolean;
  }>(),

  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  createdByClerkUserId: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("documents_brain_idx").on(t.brainId)]);

/* ---------------------------------- exports ------------------------------- */
export const exports = pgTable("exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  kind: exportKind("kind").notNull(),
  content: text("content"),                                   // rendered text for copy-paste kinds
  fileKey: text("file_key"),                                  // blob key for docx/html
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("exports_doc_idx").on(t.documentId)]);

/* -------------------------------- usage ledger ---------------------------- */
/**
 * Source of truth for credits. Every AI action appends a row; the org's
 * creditsBalance is a denormalized sum maintained in the same transaction.
 * Clerk Billing has no usage metering — this table is Wire's.
 */
export const usageLedger = pgTable("usage_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brainId: uuid("brain_id").references(() => brandBrains.id, { onDelete: "set null" }),
  reason: ledgerReason("reason").notNull(),
  credits: integer("credits").notNull(),                      // negative = spend, positive = grant
  refType: varchar("ref_type", { length: 24 }),               // run | document | export
  refId: uuid("ref_id"),
  tokensIn: integer("tokens_in").notNull().default(0),        // raw COGS telemetry
  tokensOut: integer("tokens_out").notNull().default(0),
  costUsdMicros: integer("cost_usd_micros").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ledger_org_idx").on(t.orgId, t.createdAt)]);

/* Credit price list (application constant, mirrored here for reference):
 *   generation (long-form)   20
 *   regeneration (section)    2
 *   diagnosis                 1
 *   repurpose pack            5
 *   intelligence_run        100
 * Plan grants: launch 500 / growth 1400 / scale 4000 per month.
 */
