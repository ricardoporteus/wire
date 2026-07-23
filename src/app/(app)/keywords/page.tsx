/**
 * Keywords — every phrase the research has found for this brand, across all
 * runs, with the reasoning attached.
 *
 * Read-only for now. Keywords accumulate rather than being replaced each run
 * (the pipeline upserts on brand + phrase), so this is the full working set the
 * writer targets, not just the latest month.
 *
 * Editing, import and deletion are deliberately not here yet: the pipeline's
 * upsert currently overwrites `rationale` and forces `active` back to true on
 * every run, so user edits would silently revert. That needs a `source` column
 * and a guarded upsert before any write UI is safe to ship.
 */
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, keywords } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { KeywordsClient } from "./KeywordsClient";

export default async function KeywordsPage() {
  const { orgId: clerkOrgId } = await auth();

  // requireOrg self-heals a missing org mirror instead of dead-ending; the
  // no-brain branch below then routes to onboarding.
  const brain = clerkOrgId
    ? await requireOrg().then(({ org }) =>
        db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) }))
    : null;

  if (!brain) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <span className="eyebrow">Keywords</span>
        <h1 className="mt-4 text-h2 text-ink-green">Keywords</h1>
        <p className="mt-2 text-muted">Finish onboarding to build your Brand Brain and run your first research.</p>
        <Link href="/onboarding" className="btn-accent mt-6 inline-block">Start onboarding →</Link>
      </main>
    );
  }

  const rows = await db.query.keywords.findMany({
    where: eq(keywords.brainId, brain.id),
    orderBy: [keywords.priority, desc(keywords.createdAt)],
  });

  return (
    <KeywordsClient
      brandName={brain.name}
      keywords={rows.map((k) => ({
        id: k.id,
        phrase: k.phrase,
        intent: k.intent,
        difficulty: k.difficulty,
        priority: k.priority,
        rationale: k.rationale,
        aeoFormat: k.aeoFormat,
        active: k.active,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
