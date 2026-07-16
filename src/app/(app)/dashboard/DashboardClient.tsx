"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getRunStatus, writeThisIdea } from "./actions";

type Keyword = {
  id: string; phrase: string; intent: string;
  difficulty: string | null; priority: number; aeoFormat: string | null;
};
type Idea = {
  id: string; title: string; format: string;
  whyNow: string | null; targetAeoQuestion: string | null; rank: number; status: string;
};
type CompetitorIntel = { competitor: string; topics: string[]; targetKeywords: string[]; weakness: string };
type Trend = { trend: string; opportunity: string };

const RUNNING = new Set([
  "queued", "researching_keywords", "analyzing_competitors",
  "finding_gaps", "finding_aeo", "compiling",
]);

const STAGE_LABEL: Record<string, string> = {
  queued: "Queued",
  researching_keywords: "Researching keywords",
  analyzing_competitors: "Analyzing competitors",
  finding_gaps: "Finding content gaps",
  finding_aeo: "Finding answer-engine opportunities",
  compiling: "Compiling your plan",
};

const INTENTS: { key: string; label: string }[] = [
  { key: "high_intent", label: "High intent" },
  { key: "informational", label: "Informational" },
  { key: "long_tail", label: "Long-tail" },
  { key: "aeo_question", label: "AEO questions" },
];

const PRIORITY_BADGE = (p: number) =>
  p <= 1 ? "badge--attention" : p === 2 ? "badge--opportunity" : "badge--draft";

export function DashboardClient({
  brainName, runId, runStatus, keywords, ideas, competitorIntel, trends, bestPractices, creditsBalance,
}: {
  brainName: string;
  runId: string | null;
  runStatus: string | null;
  keywords: Keyword[];
  ideas: Idea[];
  competitorIntel: CompetitorIntel[];
  trends: Trend[];
  bestPractices: string[];
  creditsBalance: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(INTENTS[0].key);
  const [writing, startWrite] = useTransition();

  const running = !!runStatus && RUNNING.has(runStatus);

  // Live run status: poll while the run is in progress, refresh when it lands.
  useEffect(() => {
    if (!runId || !running) return;
    const t = setInterval(async () => {
      const { status } = await getRunStatus(runId);
      if (!RUNNING.has(status)) router.refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [runId, running, router]);

  const write = (ideaId: string) =>
    startWrite(async () => {
      const { documentId } = await writeThisIdea(ideaId);
      router.push(`/write/${documentId}`);
    });

  const shown = keywords.filter((k) => k.intent === tab);
  const freshIdeas = ideas.filter((i) => i.status === "suggested");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <span className="eyebrow">{brainName}</span>
          <h1 className="mt-4 text-h2 text-ink-green">This month&apos;s opportunities</h1>
        </div>
        <span className="badge badge--draft whitespace-nowrap">{creditsBalance} credits</span>
      </div>

      {/* Live run status */}
      {running && (
        <div className="card--lg card mt-8">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-strong" />
            <span className="text-h5 text-ink-green">{STAGE_LABEL[runStatus!] ?? "Working…"}</span>
          </div>
          <p className="mt-2 text-body-sm text-muted">
            Your first intelligence report is running on your own domain — this is the product working live. It updates here as each stage lands.
          </p>
        </div>
      )}

      {runStatus === "failed" && (
        <p className="mt-8 rounded-md border border-negative/30 bg-[#FEECEC] px-4 py-3 text-body-sm text-negative">
          The run didn&apos;t finish. It&apos;s usually a transient issue — try running it again from settings.
        </p>
      )}

      {!runStatus && (
        <p className="mt-8 text-muted">Finish onboarding to fire your first intelligence run.</p>
      )}

      {/* Ranked ideas queue — the handoff to the writer */}
      {freshIdeas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h4 text-ink-green">Recommended this month</h2>
          <p className="mt-1 text-body-sm text-muted">{freshIdeas.length} pieces, ranked by opportunity.</p>
          <div className="mt-5 grid gap-3">
            {freshIdeas.map((i) => (
              <div key={i.id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-pill bg-accent text-micro font-medium text-ink-green">
                      {i.rank}
                    </span>
                    <h3 className="text-h5 text-ink-green">{i.title}</h3>
                  </div>
                  <p className="mt-2 text-caption text-muted">
                    <span className="badge badge--draft mr-2">{i.format.replaceAll("_", " ")}</span>
                    {i.whyNow}
                  </p>
                  {i.targetAeoQuestion && (
                    <p className="mt-1 text-micro text-muted">Answers: “{i.targetAeoQuestion}”</p>
                  )}
                </div>
                <button className="btn-accent flex-none" disabled={writing} onClick={() => write(i.id)}>
                  {writing ? "Opening…" : "Write this"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Keyword intelligence with intent tabs */}
      {keywords.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h4 text-ink-green">Keyword intelligence</h2>
          <div className="mt-4 flex flex-wrap gap-1" role="tablist">
            {INTENTS.map((it) => {
              const n = keywords.filter((k) => k.intent === it.key).length;
              if (n === 0) return null;
              return (
                <button
                  key={it.key}
                  role="tab"
                  aria-selected={tab === it.key}
                  className="tab"
                  onClick={() => setTab(it.key)}
                >
                  {it.label} <span className="text-muted">({n})</span>
                </button>
              );
            })}
          </div>
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-line text-left text-caption text-muted">
                  <th className="py-2 pr-4 font-medium">Phrase</th>
                  <th className="py-2 pr-4 font-medium">Priority</th>
                  <th className="py-2 pr-4 font-medium">Difficulty</th>
                  <th className="py-2 font-medium">Snippet</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((k) => (
                  <tr key={k.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 text-ink">{k.phrase}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${PRIORITY_BADGE(k.priority)}`}>P{k.priority}</span>
                    </td>
                    <td className="py-2 pr-4 text-muted">{k.difficulty ?? "—"}</td>
                    <td className="py-2 text-muted">{k.aeoFormat ?? "—"}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-muted">No keywords in this bucket yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Competitor cards */}
      {competitorIntel.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h4 text-ink-green">Competitors</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {competitorIntel.map((c, idx) => (
              <div key={idx} className="card">
                <h3 className="text-h5 text-ink-green">{c.competitor}</h3>
                <p className="mt-2 text-body-sm text-ink">
                  <span className="badge badge--opportunity mr-2">opening</span>{c.weakness}
                </p>
                {c.targetKeywords?.length > 0 && (
                  <p className="mt-3 text-caption text-muted">
                    Targets: {c.targetKeywords.slice(0, 6).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trends + best practices */}
      {(trends.length > 0 || bestPractices.length > 0) && (
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {trends.length > 0 && (
            <div>
              <h2 className="text-h5 text-ink-green">Trends to ride</h2>
              <ul className="mt-3 grid gap-2">
                {trends.map((t, i) => (
                  <li key={i} className="card">
                    <p className="text-body-sm font-medium text-ink-green">{t.trend}</p>
                    <p className="mt-1 text-caption text-muted">{t.opportunity}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {bestPractices.length > 0 && (
            <div>
              <h2 className="text-h5 text-ink-green">Best-practice refresh</h2>
              <ul className="mt-3 grid gap-2 text-body-sm text-ink">
                {bestPractices.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-strong">•</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
