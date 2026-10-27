/**
 * Content page — the ranked idea queue, moved off the dashboard. Reuses the
 * same decorate+sort the dashboard used for its queue.
 */
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, contentIdeas, documents, keywords } from "@/db/schema";
import { requireOrg, isResourcesAdminOrg } from "@/lib/org";
import { PER_PIECE_CREDITS } from "@/lib/credit-costs";
import { ContentClient } from "./ContentClient";

export default async function ContentPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) redirect("/onboarding");

  const { org } = await requireOrg();
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain?.wizardCompletedAt) redirect("/onboarding");

  // Bulk writer is a Mavrix-admin feature; everyone else sees the normal page.
  const isAdmin = isResourcesAdminOrg(org);
  const user = isAdmin ? await currentUser() : null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const [ideas, kws, docs] = await Promise.all([
    db.query.contentIdeas.findMany({ where: eq(contentIdeas.brainId, brain.id), orderBy: [asc(contentIdeas.rank)] }),
    db.query.keywords.findMany({ where: eq(keywords.brainId, brain.id), orderBy: [asc(keywords.priority)], limit: 200 }),
    db.query.documents.findMany({ where: eq(documents.brainId, brain.id), orderBy: [desc(documents.updatedAt)] }),
  ]);

  const priorityOf = new Map(kws.map((k) => [k.id, k.priority]));
  const phraseOf = new Map(kws.map((k) => [k.id, k.phrase]));
  const docByIdea = new Map<string, (typeof docs)[number]>();
  for (const d of docs) if (d.ideaId && !docByIdea.has(d.ideaId)) docByIdea.set(d.ideaId, d);
  const DONE = new Set(["draft", "final", "archived"]);

  const decorated = ideas
    .filter((i) => i.status !== "dismissed")
    .map((i) => {
      const doc = docByIdea.get(i.id);
      return {
        id: i.id, title: i.title, format: i.format,
        whyNow: i.whyNow, targetAeoQuestion: i.targetAeoQuestion,
        targetKeyword: (i.targetKeywordId && phraseOf.get(i.targetKeywordId)) || null,
        rank: i.rank, status: i.status,
        priority: (i.targetKeywordId && priorityOf.get(i.targetKeywordId)) || 3,
        doc: doc ? { id: doc.id, status: doc.status, done: DONE.has(doc.status) } : null,
      };
    })
    .sort((a, b) => {
      if (!!a.doc !== !!b.doc) return a.doc ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.rank - b.rank;
    });

  // Your actual pieces, newest first (docs are already ordered by updatedAt).
  const IN_FLIGHT = new Set(["diagnosing", "awaiting_confirm", "generating", "draft"]);
  const toDoc = (d: (typeof docs)[number]) => ({
    id: d.id, title: d.title ?? "Untitled draft", status: d.status,
    updatedAt: d.updatedAt ? d.updatedAt.toISOString() : null,
  });
  const drafts = docs.filter((d) => IN_FLIGHT.has(d.status)).map(toDoc);
  const published = docs.filter((d) => d.status === "final").map(toDoc);

  return (
    <ContentClient
      brainName={brain.name}
      ideas={decorated}
      drafts={drafts}
      published={published}
      isAdmin={isAdmin}
      userEmail={userEmail}
      creditsBalance={org.creditsBalance}
      perPieceCredits={PER_PIECE_CREDITS}
    />
  );
}
