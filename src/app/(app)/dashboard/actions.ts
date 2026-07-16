"use server";

/**
 * Dashboard server actions. Org-scoped like the onboarding actions: an idea or
 * run is only ever touched after confirming it belongs to the caller's org.
 */

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import {
  contentIdeas, brandBrains, organizations, intelligenceRuns, documents, sources,
} from "@/db/schema";

async function callerOrgId(): Promise<{ clerkOrgId: string; userId: string }> {
  const { orgId: clerkOrgId, userId } = await auth();
  if (!clerkOrgId || !userId) throw new Error("no_active_org");
  return { clerkOrgId, userId };
}

/** Poll target for a run in progress — returns just the status. */
export async function getRunStatus(runId: string) {
  const { clerkOrgId } = await callerOrgId();
  const run = await db.query.intelligenceRuns.findFirst({
    where: eq(intelligenceRuns.id, runId),
  });
  if (!run) return { status: "unknown" as const };
  // Ownership: run → brain → org → clerk org.
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, run.brainId) });
  const org = brain && await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) });
  if (!org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");
  return { status: run.status };
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
