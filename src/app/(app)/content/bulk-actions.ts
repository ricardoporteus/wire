"use server";

/**
 * Bulk writer server actions (Mavrix-admin only). writeBulk turns a set of cued
 * ideas into one batch of documents and writes them end-to-end (diagnose →
 * generate, no manual confirm). getBatchState is the poll target for the batch
 * progress + download page, and also finalizes the batch as a fallback to the
 * Inngest completion handler.
 */
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { requireOrg, isResourcesAdminOrg } from "@/lib/org";
import { PER_PIECE_CREDITS } from "@/lib/credit-costs";
import { limit } from "@/lib/rate-limit";
import {
  contentIdeas, brandBrains, documents, sources, writeBatches,
} from "@/db/schema";

const NO_CREDITS = "insufficient_credits" as const;

async function requireAdminOrg() {
  const { userId } = await auth();
  if (!userId) throw new Error("no_user");
  const { org } = await requireOrg();
  if (!isResourcesAdminOrg(org)) throw new Error("forbidden");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain) throw new Error("no_brain");
  return { org, brain, userId };
}

export type WriteBulkResult =
  | { ok: true; batchId: string }
  | { ok: false; error: "insufficient_credits"; affordable: number }
  | { ok: false; error: "rate_limited" | "no_ideas" | "forbidden" };

export async function writeBulk(ideaIds: string[], notifyEmail?: string): Promise<WriteBulkResult> {
  let ctx;
  try {
    ctx = await requireAdminOrg();
  } catch {
    return { ok: false, error: "forbidden" };
  }
  const { org, brain, userId } = ctx;

  const ids = [...new Set(ideaIds)].filter(Boolean);
  if (!ids.length) return { ok: false, error: "no_ideas" };

  // Only ideas that belong to this org's brain, aren't already started.
  const ideas = (await db.query.contentIdeas.findMany({ where: inArray(contentIdeas.id, ids) }))
    .filter((i) => i.brainId === brain.id);
  if (!ideas.length) return { ok: false, error: "no_ideas" };

  const cost = ideas.length * PER_PIECE_CREDITS;
  if (org.creditsBalance < cost) {
    return { ok: false, error: NO_CREDITS, affordable: Math.floor(org.creditsBalance / PER_PIECE_CREDITS) };
  }

  const rl = await limit("generate_org", org.id);
  if (!rl.ok) return { ok: false, error: "rate_limited" };

  const email = notifyEmail?.trim() && /.+@.+\..+/.test(notifyEmail.trim()) ? notifyEmail.trim() : null;

  const [batch] = await db.insert(writeBatches).values({
    brainId: brain.id, orgId: org.id, total: ideas.length,
    notifyEmail: email, createdByClerkUserId: userId,
  }).returning({ id: writeBatches.id });

  // Create a document per idea and kick off the auto-generating pipeline. Credits
  // are debited inside the jobs (diagnosis, then generation), as for a single piece.
  for (const idea of ideas) {
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
      brainId: brain.id, sourceId: src.id, ideaId: idea.id, batchId: batch.id,
      format: idea.format, status: "diagnosing", createdByClerkUserId: userId,
    }).returning({ id: documents.id });

    await db.update(contentIdeas).set({ status: "queued" }).where(eq(contentIdeas.id, idea.id));
    await inngest.send({
      name: "wire/document.diagnose.requested",
      data: { documentId: doc.id, orgId: org.id, autoGenerate: true },
    });
  }

  return { ok: true, batchId: batch.id };
}

export type BatchDoc = {
  id: string; title: string; status: string; wordCount: number | null;
  settled: boolean; ok: boolean; failed: boolean;
};
export type BatchState = {
  status: "writing" | "done" | "failed" | "unknown";
  total: number;
  settledCount: number;
  readyCount: number;
  docs: BatchDoc[];
};

const SETTLED = new Set(["draft", "final", "archived", "failed"]);
const OK = new Set(["draft", "final"]);

export async function getBatchState(batchId: string): Promise<BatchState> {
  let org, brain;
  try {
    const ctx = await requireAdminOrg();
    org = ctx.org; brain = ctx.brain;
  } catch {
    return { status: "unknown", total: 0, settledCount: 0, readyCount: 0, docs: [] };
  }

  const batch = await db.query.writeBatches.findFirst({ where: eq(writeBatches.id, batchId) });
  if (!batch || batch.orgId !== org.id) {
    return { status: "unknown", total: 0, settledCount: 0, readyCount: 0, docs: [] };
  }

  const docs = await db.query.documents.findMany({ where: eq(documents.batchId, batchId) });

  // Fallback finalizer: if everything has settled but the Inngest event was
  // missed, this marks the batch done and fires the email. Idempotent.
  if (batch.status === "writing" && docs.filter((d) => SETTLED.has(d.status)).length >= batch.total) {
    const { finalizeBatchIfComplete } = await import("@/lib/batch");
    await finalizeBatchIfComplete(batchId);
  }
  const fresh = (await db.query.writeBatches.findFirst({ where: eq(writeBatches.id, batchId) })) ?? batch;
  void brain;

  const rows: BatchDoc[] = docs
    .map((d) => {
      const brief = d.brief as { wordCount?: number } | null;
      return {
        id: d.id,
        title: d.title ?? "Untitled piece",
        status: d.status,
        wordCount: brief?.wordCount ?? null,
        settled: SETTLED.has(d.status),
        ok: OK.has(d.status),
        failed: d.status === "failed",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    status: fresh.status as BatchState["status"],
    total: fresh.total,
    settledCount: rows.filter((r) => r.settled).length,
    readyCount: rows.filter((r) => r.ok).length,
    docs: rows,
  };
}
