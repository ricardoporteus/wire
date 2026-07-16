/**
 * Dashboard skeleton — the screen a customer lands on after onboarding,
 * watching their first intelligence run stream in.
 * Claude Code: build out per docs/project-plan.md Stage 3 dashboard spec.
 */
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, brandBrains, contentIdeas, intelligenceRuns } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function DashboardPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return null;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });
  if (!org) return <main className="p-10">Setting up your workspace…</main>;

  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  const run = brain
    ? await db.query.intelligenceRuns.findFirst({
        where: eq(intelligenceRuns.brainId, brain.id),
        orderBy: [desc(intelligenceRuns.createdAt)],
      })
    : null;
  const ideas = brain
    ? await db.query.contentIdeas.findMany({
        where: eq(contentIdeas.brainId, brain.id),
        orderBy: [contentIdeas.rank], limit: 12,
      })
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">{brain?.name ?? "Wire"}</span>
      <h1 className="mt-4 text-h2">This month&apos;s opportunities</h1>
      <p className="mt-2 text-muted">
        {run?.status === "complete"
          ? `Intelligence run complete — ${ideas.length} pieces recommended.`
          : run ? `Run in progress: ${run.status.replaceAll("_", " ")}…`
          : "Finish onboarding to fire your first intelligence run."}
      </p>
      <div className="mt-8 grid gap-4">
        {ideas.map((i) => (
          <div key={i.id} className="card flex items-center justify-between">
            <div>
              <h3 className="text-h5">{i.title}</h3>
              <p className="text-caption text-muted">{i.format.replaceAll("_", " ")} · {i.whyNow}</p>
            </div>
            <button className="btn-accent">Write this</button>
          </div>
        ))}
      </div>
      <p className="mt-10 text-caption text-muted">Credits: {org.creditsBalance}</p>
    </main>
  );
}
