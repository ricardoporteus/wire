"use server";

/**
 * Writer flow server actions. Two entry points create a document (paste, URL);
 * "Write this" from the dashboard is the third (see dashboard/actions.ts). All
 * are org-scoped, and each fires the appropriate Inngest job.
 */

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, sources, brandBrains, organizations } from "@/db/schema";
import { inngest } from "@/lib/inngest";
import { requireOrg } from "@/lib/org";
import { fetchArticleText } from "@/jobs/content-writer-pipeline";

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
  let text: string;
  try {
    text = await fetchArticleText(u);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Couldn't read that URL." };
  }
  const documentId = await startDoc({ brainId: brain.id, orgId: org.id, userId, kind: "web_url", normalizedText: text, originalUrl: u });
  return { ok: true as const, documentId };
}

/** Poll target: the document's current state. */
export async function getDocState(documentId: string) {
  const { doc } = await ownedDoc(documentId);
  return {
    status: doc.status,
    format: doc.format,
    diagnosis: doc.diagnosis ?? null,
    title: doc.title ?? null,
    bodyMarkdown: doc.bodyMarkdown ?? null,
    brief: doc.brief ?? null,
  };
}

/** Confirm the diagnosis (optionally the alternative) and start generation. */
export async function confirmAndGenerate(documentId: string, useAlternative = false) {
  const { doc, org } = await ownedDoc(documentId);
  if (!doc.diagnosis) return { ok: false as const, error: "Not diagnosed yet." };

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
  await inngest.send({
    name: "wire/document.generate.requested",
    data: { documentId, orgId: org.id, regeneration: true, editorNote: editorNote.slice(0, 2000) },
  });
  return { ok: true as const };
}
