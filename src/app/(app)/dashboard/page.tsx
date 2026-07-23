/**
 * Dashboard — the screen a customer lands on after onboarding, watching their
 * first intelligence run stream in and then working the ranked idea queue.
 * Server-fetches the run's structured output; the client shell handles intent
 * tabs, live run polling, and the "Write this" handoff to the writer flow.
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, contentIdeas, documents, intelligenceRuns, keywords } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) redirect("/onboarding"); // no active workspace → pick or create one

  // requireOrg upserts the org mirror from the active Clerk org, so a session
  // whose org has not been mirrored yet (webhook not landed, or a freshly created
  // org) self-heals instead of dead-ending on "Setting up your workspace…". "/"
  // redirects here, so this is also the guard that used to live in the root page.
  const { org } = await requireOrg();

  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain?.wizardCompletedAt) redirect("/onboarding");

  const run = await db.query.intelligenceRuns.findFirst({
    where: eq(intelligenceRuns.brainId, brain.id),
    orderBy: [desc(intelligenceRuns.createdAt)],
  });

  const [ideas, kws, docs] = await Promise.all([
    db.query.contentIdeas.findMany({
      where: eq(contentIdeas.brainId, brain.id),
      orderBy: [asc(contentIdeas.rank)],
    }),
    db.query.keywords.findMany({
      where: eq(keywords.brainId, brain.id),
      orderBy: [asc(keywords.priority)],
      limit: 200,
    }),
    // Every piece started from an idea, newest first, so the queue can show what
    // is already in flight instead of the idea silently vanishing from the list.
    db.query.documents.findMany({
      where: eq(documents.brainId, brain.id),
      orderBy: [desc(documents.updatedAt)],
    }),
  ]);

  /**
   * Ideas carry a queue rank from the run, but the thing a marketer actually
   * sorts by is keyword priority: P1 before P2 before P3. Priority lives on the
   * linked keyword, so it is joined on here and rank becomes the tie-break.
   */
  const priorityOf = new Map(kws.map((k) => [k.id, k.priority]));
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
        rank: i.rank, status: i.status,
        priority: (i.targetKeywordId && priorityOf.get(i.targetKeywordId)) || 3,
        doc: doc ? { id: doc.id, status: doc.status, done: DONE.has(doc.status) } : null,
      };
    })
    .sort((a, b) => {
      // Anything already started sits at the top: it is the work in hand.
      if (!!a.doc !== !!b.doc) return a.doc ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.rank - b.rank;
    });

  return (
    <DashboardClient
      brainName={brain.name}
      runId={run?.id ?? null}
      runStatus={run?.status ?? null}
      runStartedAt={run?.startedAt ? run.startedAt.toISOString() : null}
      keywords={kws.map((k) => ({
        id: k.id, phrase: k.phrase, intent: k.intent,
        difficulty: k.difficulty, priority: k.priority, aeoFormat: k.aeoFormat,
      }))}
      ideas={decorated}
      competitorIntel={run?.competitorIntel ?? []}
      trends={run?.trends ?? []}
      bestPractices={run?.bestPractices ?? []}
      creditsBalance={org.creditsBalance}
    />
  );
}
