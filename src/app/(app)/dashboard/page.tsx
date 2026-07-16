/**
 * Dashboard — the screen a customer lands on after onboarding, watching their
 * first intelligence run stream in and then working the ranked idea queue.
 * Server-fetches the run's structured output; the client shell handles intent
 * tabs, live run polling, and the "Write this" handoff to the writer flow.
 */
import { auth } from "@clerk/nextjs/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains, contentIdeas, intelligenceRuns, keywords } from "@/db/schema";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return null;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });
  if (!org) return <main className="p-10 text-muted">Setting up your workspace…</main>;

  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <span className="eyebrow">Wire</span>
        <h1 className="mt-4 text-h2 text-ink-green">This month&apos;s opportunities</h1>
        <p className="mt-2 text-muted">Finish onboarding to build your Brand Brain and fire your first run.</p>
      </main>
    );
  }

  const run = await db.query.intelligenceRuns.findFirst({
    where: eq(intelligenceRuns.brainId, brain.id),
    orderBy: [desc(intelligenceRuns.createdAt)],
  });

  const [ideas, kws] = await Promise.all([
    db.query.contentIdeas.findMany({
      where: eq(contentIdeas.brainId, brain.id),
      orderBy: [asc(contentIdeas.rank)],
    }),
    db.query.keywords.findMany({
      where: eq(keywords.brainId, brain.id),
      orderBy: [asc(keywords.priority)],
      limit: 200,
    }),
  ]);

  return (
    <DashboardClient
      brainName={brain.name}
      runId={run?.id ?? null}
      runStatus={run?.status ?? null}
      keywords={kws.map((k) => ({
        id: k.id, phrase: k.phrase, intent: k.intent,
        difficulty: k.difficulty, priority: k.priority, aeoFormat: k.aeoFormat,
      }))}
      ideas={ideas.map((i) => ({
        id: i.id, title: i.title, format: i.format,
        whyNow: i.whyNow, targetAeoQuestion: i.targetAeoQuestion, rank: i.rank, status: i.status,
      }))}
      competitorIntel={run?.competitorIntel ?? []}
      trends={run?.trends ?? []}
      bestPractices={run?.bestPractices ?? []}
      creditsBalance={org.creditsBalance}
    />
  );
}
