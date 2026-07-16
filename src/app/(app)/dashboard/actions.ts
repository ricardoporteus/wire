"use server";

/**
 * Dashboard server actions. Org-scoped like the onboarding actions: an idea or
 * run is only ever touched after confirming it belongs to the caller's org.
 */

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { CREDIT_COSTS } from "@/lib/credits";
import {
  contentIdeas, brandBrains, organizations, intelligenceRuns, documents, sources, keywords, runEvents,
} from "@/db/schema";

const RUNNING_STATES = new Set([
  "queued", "researching_keywords", "analyzing_competitors", "finding_gaps", "finding_aeo", "compiling",
]);

async function callerOrgId(): Promise<{ clerkOrgId: string; userId: string }> {
  const { orgId: clerkOrgId, userId } = await auth();
  if (!clerkOrgId || !userId) throw new Error("no_active_org");
  return { clerkOrgId, userId };
}

export type FeedEvent = {
  seq: number;
  stage: string;
  kind: string;
  message: string;
  titles?: string[];
  count?: number;
};
type RunProgressSnapshot = {
  status: string;
  startedAt: string | null;
  counts: { keywords: number; competitors: number; ideas: number };
  events: FeedEvent[];
  maxSeq: number;
};

/**
 * Poll target for a run in progress. Returns the current stage (status), the
 * start time (for the elapsed timer), live result counts, and the tail of the
 * activity feed after `sinceSeq` — so the dashboard streams a granular,
 * fast-moving "what's happening right now" feed as the pipeline works.
 */
export async function getRunStatus(runId: string, sinceSeq = 0): Promise<RunProgressSnapshot> {
  const empty = { keywords: 0, competitors: 0, ideas: 0 };
  const { clerkOrgId } = await callerOrgId();
  const run = await db.query.intelligenceRuns.findFirst({
    where: eq(intelligenceRuns.id, runId),
  });
  if (!run) return { status: "unknown", startedAt: null, counts: empty, events: [], maxSeq: sinceSeq };
  // Ownership: run → brain → org → clerk org.
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, run.brainId) });
  const org = brain && await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) });
  if (!org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");

  const [kw, id, evs] = await Promise.all([
    db.select({ n: count() }).from(keywords).where(eq(keywords.runId, runId)),
    db.select({ n: count() }).from(contentIdeas).where(eq(contentIdeas.runId, runId)),
    db.select().from(runEvents)
      .where(and(eq(runEvents.runId, runId), gt(runEvents.seq, sinceSeq)))
      .orderBy(asc(runEvents.seq)).limit(300),
  ]);
  const events: FeedEvent[] = evs.map((e) => ({
    seq: e.seq, stage: e.stage, kind: e.kind, message: e.message,
    titles: e.meta?.titles, count: e.meta?.count,
  }));
  return {
    status: run.status,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    counts: {
      keywords: kw[0]?.n ?? 0,
      competitors: run.competitorIntel?.length ?? 0,
      ideas: id[0]?.n ?? 0,
    },
    events,
    maxSeq: events.length ? events[events.length - 1].seq : sinceSeq,
  };
}

/**
 * On-demand intelligence run. Mirrors the onboarding enqueue: create a queued
 * run row and fire the pipeline event. Pre-checks balance and refuses if a run
 * is already in flight (the pipeline debits 100 credits atomically at start).
 */
export async function rerunIntelligence(): Promise<
  | { ok: true; runId: string }
  | { ok: false; error: "insufficient_credits" | "already_running" | "not_ready"; runId?: string }
> {
  const { clerkOrgId } = await callerOrgId();
  const org = await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) });
  if (!org) throw new Error("no_active_org");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain || !brain.wizardCompletedAt) return { ok: false, error: "not_ready" };

  // Don't stack runs — surface the one already going instead.
  const latest = await db.query.intelligenceRuns.findFirst({
    where: eq(intelligenceRuns.brainId, brain.id),
    orderBy: [desc(intelligenceRuns.createdAt)],
  });
  if (latest && RUNNING_STATES.has(latest.status)) {
    return { ok: false, error: "already_running", runId: latest.id };
  }
  if (org.creditsBalance < CREDIT_COSTS.intelligence_run) {
    return { ok: false, error: "insufficient_credits" };
  }

  const runId = randomUUID();
  await db.insert(intelligenceRuns).values({
    id: runId, brainId: brain.id, trigger: "on_demand", status: "queued",
  });
  await inngest.send({
    name: "wire/intelligence.run.requested",
    data: { runId, brainId: brain.id, orgId: org.id },
  });
  return { ok: true, runId };
}

/**
 * "Write this" — turn a recommended idea into a document and hand off to the
 * writer flow. Creates the document in `diagnosing` state (the writer runs the
 * diagnosis step next) and marks the idea as queued so it leaves the fresh list.
 */
export async function writeThisIdea(ideaId: string) {
  const { clerkOrgId, userId } = await callerOrgId();

  const idea = await db.query.contentIdeas.findFirst({ where: eq(contentIdeas.id, ideaId) });
  if (!idea) throw new Error("idea_not_found");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, idea.brainId) });
  const org = brain && await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) });
  if (!brain || !org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");

  // An idea has no external source, so seed one from the brief — the diagnosis
  // step reads it as the source material and grounds against live intelligence.
  const seed = [
    `Content brief for a new ${idea.format.replaceAll("_", " ")}.`,
    `Working title: ${idea.title}`,
    idea.whyNow ? `Why this matters now: ${idea.whyNow}` : "",
    idea.targetAeoQuestion ? `Question to answer: ${idea.targetAeoQuestion}` : "",
    `Write an original, on-brand piece that delivers on this brief for the brand's ICP.`,
  ].filter(Boolean).join("\n");

  const [src] = await db.insert(sources).values({
    brainId: brain.id, kind: "pasted_text", status: "ready",
    normalizedText: seed, createdByClerkUserId: userId,
  }).returning({ id: sources.id });

  const [doc] = await db.insert(documents).values({
    brainId: brain.id,
    sourceId: src.id,
    ideaId: idea.id,
    format: idea.format,
    status: "diagnosing",
    createdByClerkUserId: userId,
  }).returning({ id: documents.id });

  await db.update(contentIdeas).set({ status: "queued" }).where(eq(contentIdeas.id, idea.id));
  await inngest.send({ name: "wire/document.diagnose.requested", data: { documentId: doc.id, orgId: org.id } });

  return { documentId: doc.id };
}
