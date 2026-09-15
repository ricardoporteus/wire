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
  INTENT_LABEL, PRIORITY_BADGE, RUN_STATUS_BADGE, RUN_STATUS_LABEL,
  TRIGGER_LABEL, formatDateTime, formatDuration, RUNNING_STATUSES,
} from "@/lib/seo-labels";
import { RerunButton } from "./RerunButton";

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
          <span className="eyebrow">Audit</span>
          <h1 className="mt-4 text-h2 text-ink-green">SEO &amp; AEO audit</h1>
          <p className="mt-2 text-muted">
            What the research found for {brain.name}, run by run.
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
        {runKeywords.length === 0 ? (
          <p className="text-body-sm text-muted">No keywords were saved for this run.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-body-sm">
              <thead>
                <tr className="border-b border-line text-caption uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Phrase<InfoTip text={TIPS.phrase} /></th>
                  <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Intent<InfoTip text={TIPS.intent} /></th>
                  <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Priority<InfoTip text={TIPS.priority} /></th>
                  <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Difficulty<InfoTip text={TIPS.difficulty} /></th>
                  <th className="whitespace-nowrap py-2 text-left font-medium">Why it matters<InfoTip text={TIPS.why} align="right" /></th>
                </tr>
              </thead>
              <tbody>
                {runKeywords.map((k) => (
                  <tr key={k.id} className="border-b border-line align-top">
                    <td className="py-2.5 pr-4 font-medium text-ink-green">{k.phrase}</td>
                    <td className="py-2.5 pr-4 text-muted">{INTENT_LABEL[k.intent] ?? k.intent}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${PRIORITY_BADGE(k.priority)}`}>P{k.priority}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">{k.difficulty ?? (k.intent === "aeo_question" ? "n/a" : "—")}</td>
                    <td className="py-2.5 text-muted">{whyItMatters(k)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-body-sm">
            <thead>
              <tr className="border-b border-line text-caption uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 text-left font-medium">Date</th>
                <th className="py-2 pr-4 text-left font-medium">Trigger</th>
                <th className="py-2 pr-4 text-left font-medium">Status</th>
                <th className="py-2 pr-4 text-left font-medium">Duration</th>
                <th className="py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const isSelected = r.id === selected.id;
                return (
                  <tr key={r.id} className={`border-b border-line ${isSelected ? "bg-accent-tint" : ""}`}>
                    <td className="py-2.5 pr-4 text-ink-green">{formatDateTime(r.createdAt)}</td>
                    <td className="py-2.5 pr-4 text-muted">{TRIGGER_LABEL[r.trigger] ?? r.trigger}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${RUN_STATUS_BADGE(r.status)}`}>
                        {RUN_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">{formatDuration(r.startedAt, r.completedAt)}</td>
                    <td className="py-2.5 text-right">
                      {isSelected ? (
                        <span className="text-caption text-muted">Viewing</span>
                      ) : (
                        <Link href={`/audit?run=${r.id}`} className="text-caption text-accent-ink hover:underline">
                          View report
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

/** Plain-language explanations for the keyword table's column headers. */
const TIPS = {
  phrase: "The exact search phrase or question your audience types — a keyword phrase (e.g. “AI content marketing tool”) or an answer-engine question the research found them asking. Each becomes a target for a piece of content.",
  intent: "What the searcher is trying to do. High intent = ready to act (commercial); Informational = still researching; Long-tail = specific, lower-volume phrases; AEO question = something people ask AI and search engines. Intent shapes the format and angle of the piece Mavrix writes.",
  priority: "How urgently to target this, from P1 to P3. P1 is red-hot — high value and winnable now, so write these first. Priority is set by the research from intent, opportunity size, and how much strong competition already owns the result.",
  difficulty: "How hard it is to rank for this keyword — high, medium, or low — estimated from how much strong competition already targets it. Shows 'n/a' for answer-engine questions, where keyword difficulty does not apply.",
  why: "Why this phrase is worth your time: the opportunity or angle the research found. For featured-snippet questions it tells you the format to win the answer box — a paragraph, a list, or a table.",
} as const;

/**
 * A small "(i)" marker with a hover/focus tooltip explaining a column. Pure CSS
 * (group-hover + group-focus-within) so it works in this server component with
 * no client JS. Anchored below the header to avoid the table's overflow clip;
 * pass align="right" for the last column so the popup opens inward.
 */
function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold normal-case leading-none text-muted transition-colors hover:border-ink-green hover:text-ink-green focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-[calc(100%_+_6px)] z-20 w-64 rounded-md border border-line bg-card p-3 text-left text-caption font-normal normal-case leading-relaxed tracking-normal text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${align === "right" ? "right-0" : "left-0"}`}
      >
        {text}
      </span>
    </span>
  );
}

/**
 * "Why it matters" cell text. Prefer the model's rationale/angle. For
 * answer-engine questions that predate the angle field (or where the model
 * omitted it), fall back to the captured snippet format so the highest-priority
 * rows still say something actionable instead of a bare dash.
 */
function whyItMatters(k: { rationale: string | null; intent: string; aeoFormat: string | null }): string {
  if (k.rationale) return k.rationale;
  if (k.intent === "aeo_question") {
    return k.aeoFormat
      ? `Featured-snippet target — win it with a ${k.aeoFormat}.`
      : "Answer-engine target — write a direct, structured answer to win the AI/snippet result.";
  }
  return "—";
}

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
