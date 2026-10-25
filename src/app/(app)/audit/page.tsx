/**
 * Monthly SEO/AEO audit — the full report for one intelligence run, plus the
 * history of every run before it.
 *
 * Read-only by design. The run's findings were already being produced and
 * stored; until now they were only visible on the dashboard, for the latest run,
 * with no way back to an earlier one. `?run=<id>` is the permalink.
 *
 * Editing keywords, changing cadence and importing live elsewhere: this page is
 * the record of what the research actually found.
 */
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, intelligenceRuns, keywords, contentIdeas } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import {
  RUN_STATUS_BADGE, RUN_STATUS_LABEL,
  TRIGGER_LABEL, formatDateTime, formatDuration, RUNNING_STATUSES,
} from "@/lib/seo-labels";
import { RerunButton } from "./RerunButton";
import { ResearchKeywords } from "./ResearchKeywords";
import { RunHistory } from "./RunHistory";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run: runParam } = await searchParams;
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return <Empty />;

  // requireOrg self-heals a missing org mirror instead of dead-ending.
  const { org } = await requireOrg();
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain) return <Empty />;

  const runs = await db.query.intelligenceRuns.findMany({
    where: eq(intelligenceRuns.brainId, brain.id),
    orderBy: [desc(intelligenceRuns.createdAt)],
    limit: 24,
  });
  if (runs.length === 0) return <Empty brandName={brain.name} />;

  // Permalinked run if it belongs to this brain, otherwise the most recent.
  const selected = (runParam && runs.find((r) => r.id === runParam)) || runs[0];

  const [runKeywords, runIdeas] = await Promise.all([
    db.query.keywords.findMany({
      where: and(eq(keywords.brainId, brain.id), eq(keywords.runId, selected.id)),
      orderBy: [keywords.priority],
    }),
    db.query.contentIdeas.findMany({
      where: and(eq(contentIdeas.brainId, brain.id), eq(contentIdeas.runId, selected.id)),
      orderBy: [contentIdeas.rank],
    }),
  ]);

  const running = RUNNING_STATUSES.has(selected.status);
  const competitors = selected.competitorIntel ?? [];
  const trends = selected.trends ?? [];
  const bestPractices = selected.bestPractices ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Research · Scout &amp; Ada</span>
          <h1 className="mt-4 text-h2 text-ink-green">Research</h1>
          <p className="mt-2 text-muted">
            Scout and Ada&apos;s monthly sweep of your market — keywords, answer-engine opportunities, competitors and trends for {brain.name}.
          </p>
        </div>
        <RerunButton running={running} />
      </div>

      {/* ---- Run summary --------------------------------------------------- */}
      <div className="card mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`badge ${RUN_STATUS_BADGE(selected.status)}`}>
              {RUN_STATUS_LABEL[selected.status] ?? selected.status}
            </span>
            <span className="text-body-sm text-muted">{TRIGGER_LABEL[selected.trigger] ?? selected.trigger}</span>
            <span className="text-body-sm text-muted">{formatDateTime(selected.createdAt)}</span>
          </div>
          {runs.length > 1 && (
            <span className="text-caption text-muted">
              Run {runs.findIndex((r) => r.id === selected.id) + 1} of {runs.length}
            </span>
          )}
        </div>

        {selected.error && (
          <p className="mt-4 rounded-md bg-[#FEECEC] px-4 py-3 text-body-sm text-[#B42324]">{selected.error}</p>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Keywords found" value={runKeywords.length} />
          <Stat label="Ideas produced" value={runIdeas.length} />
          <Stat label="Competitors profiled" value={competitors.length} />
          <Stat label="Duration" value={formatDuration(selected.startedAt, selected.completedAt)} />
        </dl>
      </div>

      {/* ---- Keywords from this run --------------------------------------- */}
      <Section title="Keywords from this run" count={runKeywords.length}>
        <a href="/keywords" className="mb-3 inline-block text-caption font-semibold text-accent-strong hover:underline">
          Browse all keywords, every run →
        </a>
        <ResearchKeywords
          keywords={runKeywords.map((k) => ({
            id: k.id, phrase: k.phrase, intent: k.intent, priority: k.priority,
            difficulty: k.difficulty, kd: k.kd, searchVolume: k.searchVolume,
            aeoFormat: k.aeoFormat, rationale: k.rationale, recommendedFormat: k.recommendedFormat,
            variants: k.variants,
          }))}
        />
      </Section>

      {/* ---- Competitors --------------------------------------------------- */}
      {competitors.length > 0 && (
        <Section title="Competitors" count={competitors.length}>
          <div className="grid gap-4 md:grid-cols-2">
            {competitors.map((c, i) => (
              <div key={`${c.competitor}-${i}`} className="rounded-md border border-line p-5">
                <h3 className="text-h5 text-ink-green">{c.competitor}</h3>
                {c.weakness && <p className="mt-2 text-body-sm text-muted">{c.weakness}</p>}
                {c.topics?.length > 0 && (
                  <p className="mt-3 text-caption text-muted">
                    <strong className="text-ink-green">Topics they own:</strong> {c.topics.join(", ")}
                  </p>
                )}
                {c.targetKeywords?.length > 0 && (
                  <p className="mt-1.5 text-caption text-muted">
                    <strong className="text-ink-green">Ranking for:</strong> {c.targetKeywords.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ---- Trends + best practice --------------------------------------- */}
      {(trends.length > 0 || bestPractices.length > 0) && (
        <Section title="Trends and best practice">
          <div className="grid gap-6 md:grid-cols-2">
            {trends.length > 0 && (
              <div>
                <h3 className="text-h5 text-ink-green">Trends to ride</h3>
                <ul className="mt-3 space-y-3">
                  {trends.map((t, i) => (
                    <li key={i} className="border-b border-line pb-3 last:border-0">
                      <p className="text-body-sm font-medium text-ink-green">{t.trend}</p>
                      <p className="mt-1 text-body-sm text-muted">{t.opportunity}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bestPractices.length > 0 && (
              <div>
                <h3 className="text-h5 text-ink-green">Best-practice refresh</h3>
                <ul className="mt-3 space-y-2">
                  {bestPractices.map((b, i) => (
                    <li key={i} className="text-body-sm text-muted">• {b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ---- Ideas produced ------------------------------------------------ */}
      {runIdeas.length > 0 && (
        <Section title="Ideas produced" count={runIdeas.length}>
          <ul className="space-y-3">
            {runIdeas.map((i) => (
              <li key={i.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-line pb-3 last:border-0">
                <span className="text-caption text-muted">#{i.rank}</span>
                <span className="text-body-sm font-medium text-ink-green">{i.title}</span>
                <span className="badge badge--draft">{i.status}</span>
                {i.whyNow && <p className="w-full text-body-sm text-muted">{i.whyNow}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---- Run history --------------------------------------------------- */}
      <Section title="Run history" count={runs.length}>
        <RunHistory
          runs={runs.map((r) => ({
            id: r.id, trigger: r.trigger, status: r.status,
            createdAt: r.createdAt.toISOString(),
            startedAt: r.startedAt ? r.startedAt.toISOString() : null,
            completedAt: r.completedAt ? r.completedAt.toISOString() : null,
          }))}
          selectedId={selected.id}
        />
      </Section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */


function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="mt-1 font-display text-h4 text-ink-green">{value}</dd>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-h4 text-ink-green">
        {title}
        {count !== undefined && <span className="ml-2 text-body-sm font-normal text-muted">{count}</span>}
      </h2>
      <div className="card mt-4">{children}</div>
    </section>
  );
}

function Empty({ brandName }: { brandName?: string } = {}) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">Audit</span>
      <h1 className="mt-4 text-h2 text-ink-green">SEO &amp; AEO audit</h1>
      <p className="mt-2 text-muted">
        {brandName
          ? "No runs yet. Fire your first intelligence run from the dashboard and the report will appear here."
          : "Finish onboarding to build your Brand Brain, then your first audit will appear here."}
      </p>
      <Link href="/dashboard" className="btn-accent mt-6 inline-block">Go to dashboard →</Link>
    </main>
  );
}
