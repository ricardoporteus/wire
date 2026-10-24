/**
 * Dashboard — the screen a customer lands on after onboarding, watching their
 * first intelligence run stream in and then working the ranked idea queue.
 * Server-fetches the run's structured output; the client shell handles intent
 * tabs, live run polling, and the "Write this" handoff to the writer flow.
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, asc, count, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, contentIdeas, documents, intelligenceRuns, keywords, usageLedger } from "@/db/schema";
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

  /* ----------------------------- Tier-1 overview ---------------------------- */
  // Drafts still being worked (anything not shelved, published, or errored).
  const IN_FLIGHT = new Set(["diagnosing", "awaiting_confirm", "generating", "draft"]);
  const inProgress = docs
    .filter((d) => IN_FLIGHT.has(d.status))
    .slice(0, 4)
    .map((d) => ({ id: d.id, title: d.title ?? "Untitled draft", status: d.status }));

  // Fact-check items still to review (flagged = unverified, left in the body).
  // factCheck is written into brief at runtime; the column's TS type predates it.
  let reviewClaims = 0, reviewDocs = 0;
  for (const d of docs) {
    if (d.status !== "draft" && d.status !== "final") continue;
    const fc = (d.brief as { factCheck?: { flagged?: unknown[] } } | null)?.factCheck;
    const n = Array.isArray(fc?.flagged) ? fc!.flagged!.length : 0;
    if (n > 0) { reviewClaims += n; reviewDocs++; }
  }

  // P1 coverage: of the red-hot keywords, how many have a piece started.
  const coveredKwIds = new Set<string>();
  for (const i of ideas) if (i.targetKeywordId && docByIdea.has(i.id)) coveredKwIds.add(i.targetKeywordId);
  const p1 = kws.filter((k) => k.priority === 1);
  const p1Covered = p1.filter((k) => coveredKwIds.has(k.id)).length;

  // Latest-sweep counts + days to the next monthly run (cron: 1st of the month).
  const [kwRun, ideaRun] = run
    ? await Promise.all([
        db.select({ n: count() }).from(keywords).where(eq(keywords.runId, run.id)),
        db.select({ n: count() }).from(contentIdeas).where(eq(contentIdeas.runId, run.id)),
      ])
    : [[{ n: 0 }], [{ n: 0 }]];
  const lastSweepAt = run?.completedAt ?? run?.createdAt ?? null;
  const now = new Date();
  const nextSweep = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 6, 0, 0));
  const nextSweepDays = Math.max(0, Math.ceil((nextSweep.getTime() - now.getTime()) / 86_400_000));

  // Credit burn: spend by reason over the last 30 days → weekly burn + runway.
  const since = new Date(Date.now() - 30 * 86_400_000);
  const spendRows = await db
    .select({ reason: usageLedger.reason, total: sql<number>`sum(${usageLedger.credits})` })
    .from(usageLedger)
    .where(and(eq(usageLedger.orgId, org.id), lt(usageLedger.credits, 0), gt(usageLedger.createdAt, since)))
    .groupBy(usageLedger.reason);
  const spent30 = spendRows.reduce((s, r) => s + Math.abs(Number(r.total) || 0), 0);
  const weeklyBurn = Math.round((spent30 / 30) * 7);
  const weeksLeft = weeklyBurn > 0 ? Math.round((org.creditsBalance / weeklyBurn) * 10) / 10 : null;
  const breakdown = spendRows
    .map((r) => ({ reason: r.reason as string, credits: Math.abs(Number(r.total) || 0) }))
    .filter((r) => r.credits > 0)
    .sort((a, b) => b.credits - a.credits);

  const overview = {
    inProgress,
    reviewClaims,
    reviewDocs,
    coverage: { p1Total: p1.length, p1Covered, pct: p1.length ? Math.round((p1Covered / p1.length) * 100) : 0 },
    freshness: {
      lastSweepAt: lastSweepAt ? lastSweepAt.toISOString() : null,
      kwCount: kwRun[0].n, ideaCount: ideaRun[0].n,
      competitorCount: run?.competitorIntel?.length ?? 0,
      nextSweepDays,
    },
    credits: { balance: org.creditsBalance, weeklyBurn, weeksLeft, spent30, breakdown },
  };

  return (
    <DashboardClient
      brainName={brain.name}
      runId={run?.id ?? null}
      runStatus={run?.status ?? null}
      runStartedAt={run?.startedAt ? run.startedAt.toISOString() : null}
      keywords={kws.map((k) => ({
        id: k.id, phrase: k.phrase, intent: k.intent,
        difficulty: k.difficulty, kd: k.kd, searchVolume: k.searchVolume, priority: k.priority, aeoFormat: k.aeoFormat,
      }))}
      ideas={decorated}
      competitorIntel={run?.competitorIntel ?? []}
      trends={run?.trends ?? []}
      bestPractices={run?.bestPractices ?? []}
      overview={overview}
    />
  );
}
