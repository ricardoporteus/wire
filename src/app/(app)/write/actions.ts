"use server";

/**
 * Writer flow server actions. Two entry points create a document (paste, URL);
 * "Write this" from the dashboard is the third (see dashboard/actions.ts). All
 * are org-scoped, and each fires the appropriate Inngest job.
 */

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, sources, brandBrains, organizations, exports as exportsTable, docEvents } from "@/db/schema";
import { inngest } from "@/lib/inngest";
import { requireOrg } from "@/lib/org";
import { CREDIT_COSTS, debitCredits } from "@/lib/credits";
import { limit, type RateLimitResult } from "@/lib/rate-limit";
import { fetchArticleText } from "@/jobs/content-writer-pipeline";

/** Sentinel the UI recognizes to show the upgrade prompt. */
const NO_CREDITS = "insufficient_credits" as const;

const rateMsg = (r: RateLimitResult) => `Too many requests — please wait about ${r.retryAfterSec}s and try again.`;

async function ownedDoc(documentId: string) {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) throw new Error("no_active_org");
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) throw new Error("doc_not_found");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, doc.brainId) });
  const org = brain && (await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) }));
  if (!org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");
  return { doc, org };
}

/** Create a document from a ready source and kick off diagnosis. */
async function startDoc(opts: {
  brainId: string; orgId: string; userId: string;
  kind: "pasted_text" | "web_url"; normalizedText: string; originalUrl?: string;
}) {
  const [src] = await db.insert(sources).values({
    brainId: opts.brainId,
    kind: opts.kind,
    status: "ready",
    originalUrl: opts.originalUrl ?? null,
    normalizedText: opts.normalizedText,
    meta: { wordCount: opts.normalizedText.split(/\s+/).filter(Boolean).length },
    createdByClerkUserId: opts.userId,
  }).returning({ id: sources.id });

  const [doc] = await db.insert(documents).values({
    brainId: opts.brainId,
    sourceId: src.id,
    format: "article",
    status: "diagnosing",
    createdByClerkUserId: opts.userId,
  }).returning({ id: documents.id });

  await inngest.send({ name: "wire/document.diagnose.requested", data: { documentId: doc.id, orgId: opts.orgId } });
  return doc.id;
}

async function brainAndUser() {
  const { org } = await requireOrg();
  const { userId } = await auth();
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain) throw new Error("no_brain");
  if (!userId) throw new Error("no_user");
  return { org, brain, userId };
}

export async function createFromPaste(text: string) {
  const clean = text.trim();
  if (clean.length < 40) return { ok: false as const, error: "Paste a bit more to work with (at least a few sentences)." };
  const { org, brain, userId } = await brainAndUser();
  if (org.creditsBalance < CREDIT_COSTS.diagnosis) return { ok: false as const, error: NO_CREDITS };
  const documentId = await startDoc({ brainId: brain.id, orgId: org.id, userId, kind: "pasted_text", normalizedText: clean });
  return { ok: true as const, documentId };
}

export async function createFromUrl(url: string) {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    new URL(u);
  } catch {
    return { ok: false as const, error: "That doesn't look like a valid URL." };
  }
  const { org, brain, userId } = await brainAndUser();
  if (org.creditsBalance < CREDIT_COSTS.diagnosis) return { ok: false as const, error: NO_CREDITS };
  let text: string;
  try {
    text = await fetchArticleText(u);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Couldn't read that URL." };
  }
  const documentId = await startDoc({ brainId: brain.id, orgId: org.id, userId, kind: "web_url", normalizedText: text, originalUrl: u });
  return { ok: true as const, documentId };
}

/**
 * Audio / video / podcast link. Unlike paste and URL, transcription is slow, so
 * this cannot run inline: it creates the source and document, charges the
 * transcription credit up front, and hands off to the async ingest pipeline,
 * which transcribes, refunds on failure, and chains into diagnosis when ready.
 * The writer page then streams the transcription and diagnosis feed as usual.
 */
export async function createFromMediaLink(url: string) {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    new URL(u);
  } catch {
    return { ok: false as const, error: "That doesn't look like a valid link." };
  }

  // Streaming player pages expose no downloadable media, so reject them up front
  // with guidance rather than charging, failing, and refunding. Spotify and
  // Apple in particular are where people paste from.
  if (/(?:open\.spotify\.com|spotify\.link|podcasts\.apple\.com|music\.apple\.com)/i.test(u)) {
    return {
      ok: false as const,
      error:
        "Spotify and Apple links are player pages we can't download. Use the show's RSS feed or a direct episode MP3 " +
        "(most podcasts link one in their show notes), or a YouTube link.",
    };
  }

  const { org, brain, userId } = await brainAndUser();
  // Needs the transcription charge now, plus diagnosis afterwards.
  if (org.creditsBalance < CREDIT_COSTS.transcription + CREDIT_COSTS.diagnosis) {
    return { ok: false as const, error: NO_CREDITS };
  }

  // video_link for YouTube (routed to the caption/API path), audio_link
  // otherwise. Both resolve inside lib/transcription; the distinction is only for
  // the record and light UI hinting.
  const isYouTube = /(?:youtube\.com\/|youtu\.be\/)/i.test(u);
  const kind = isYouTube ? "video_link" : "audio_link";

  const [src] = await db.insert(sources).values({
    brainId: brain.id, kind, status: "pending", originalUrl: u,
    createdByClerkUserId: userId,
  }).returning({ id: sources.id });

  const [doc] = await db.insert(documents).values({
    brainId: brain.id, sourceId: src.id, format: "article",
    status: "diagnosing", createdByClerkUserId: userId,
  }).returning({ id: documents.id });

  // Charge up front so transcription can never run for free; ingest refunds if it
  // fails. If the balance slipped between the check above and here, undo cleanly.
  try {
    await debitCredits({
      orgId: org.id, brainId: brain.id, reason: "transcription",
      refType: "document", refId: doc.id,
    });
  } catch {
    await db.update(documents).set({ status: "archived" }).where(eq(documents.id, doc.id));
    return { ok: false as const, error: NO_CREDITS };
  }

  await inngest.send({
    name: "wire/source.ingest.requested",
    data: { sourceId: src.id, documentId: doc.id, orgId: org.id },
  });
  return { ok: true as const, documentId: doc.id };
}

/** Poll target: the document's current state. */
export async function getDocState(documentId: string) {
  const { doc } = await ownedDoc(documentId);
  // The source carries the failure reason (e.g. a transcription error); the
  // document only carries the "failed" status, so read both.
  const src = doc.sourceId
    ? await db.query.sources.findFirst({ where: eq(sources.id, doc.sourceId) })
    : null;
  return {
    status: doc.status,
    format: doc.format,
    diagnosis: doc.diagnosis ?? null,
    title: doc.title ?? null,
    bodyMarkdown: doc.bodyMarkdown ?? null,
    brief: doc.brief ?? null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    sourceStatus: src?.status ?? null,
    sourceError: src?.error ?? null,
  };
}

export type DocFeedEvent = { seq: number; phase: string; kind: string; message: string; words?: number; stage?: string };

/** Poll target: the document's live activity feed after `sinceSeq`. */
export async function getDocFeed(documentId: string, sinceSeq = 0): Promise<{
  status: string; events: DocFeedEvent[]; maxSeq: number;
}> {
  const { doc } = await ownedDoc(documentId);
  const evs = await db.select().from(docEvents)
    .where(and(eq(docEvents.documentId, documentId), gt(docEvents.seq, sinceSeq)))
    .orderBy(asc(docEvents.seq)).limit(200);
  const events: DocFeedEvent[] = evs.map((e) => ({
    seq: e.seq, phase: e.phase, kind: e.kind, message: e.message, words: e.meta?.words, stage: e.meta?.stage,
  }));
  return { status: doc.status, events, maxSeq: events.length ? events[events.length - 1].seq : sinceSeq };
}

/** Confirm the diagnosis (optionally the alternative) and start generation. */
export async function confirmAndGenerate(documentId: string, useAlternative = false) {
  const { doc, org } = await ownedDoc(documentId);
  if (!doc.diagnosis) return { ok: false as const, error: "Not diagnosed yet." };
  if (org.creditsBalance < CREDIT_COSTS.generation) return { ok: false as const, error: NO_CREDITS };
  const genRl = await limit("generate_org", org.id);
  if (!genRl.ok) return { ok: false as const, error: rateMsg(genRl) };

  if (useAlternative && doc.diagnosis.alternative) {
    const alt = doc.diagnosis.alternative;
    await db.update(documents).set({
      format: alt.format as typeof doc.format,
      diagnosis: { ...doc.diagnosis, recommendedTitle: alt.title },
      updatedAt: new Date(),
    }).where(eq(documents.id, documentId));
  }

  await inngest.send({ name: "wire/document.generate.requested", data: { documentId, orgId: org.id } });
  return { ok: true as const };
}

/** Regenerate the draft with an editor note (cheaper: regeneration credit). */
export async function regenerate(documentId: string, editorNote: string) {
  const { doc, org } = await ownedDoc(documentId);
  if (!doc.diagnosis) return { ok: false as const, error: "Nothing to regenerate yet." };
  if (org.creditsBalance < CREDIT_COSTS.regeneration) return { ok: false as const, error: NO_CREDITS };
  const regenRl = await limit("generate_org", org.id);
  if (!regenRl.ok) return { ok: false as const, error: rateMsg(regenRl) };
  await inngest.send({
    name: "wire/document.generate.requested",
    data: { documentId, orgId: org.id, regeneration: true, editorNote: editorNote.slice(0, 2000) },
  });
  return { ok: true as const };
}

/** Fire one repurpose pack for the selected channel kinds (5 credits). */
export async function createRepurposePack(documentId: string, kinds: string[]) {
  const { doc, org } = await ownedDoc(documentId);
  if (!doc.bodyMarkdown) return { ok: false as const, error: "Generate the piece first." };
  if (!kinds.length) return { ok: false as const, error: "Pick at least one format." };
  if (org.creditsBalance < CREDIT_COSTS.repurpose) return { ok: false as const, error: NO_CREDITS };
  const repRl = await limit("repurpose_org", org.id);
  if (!repRl.ok) return { ok: false as const, error: rateMsg(repRl) };
  await inngest.send({
    name: "wire/document.repurpose.requested",
    data: { documentId, orgId: org.id, kinds },
  });
  return { ok: true as const };
}

/** Current export rows for a document (poll target + display). */
export async function getExports(documentId: string) {
  await ownedDoc(documentId);
  const rows = await db.query.exports.findMany({
    where: eq(exportsTable.documentId, documentId),
    orderBy: [exportsTable.createdAt],
  });
  return rows.map((r) => ({ id: r.id, kind: r.kind, content: r.content ?? "" }));
}
