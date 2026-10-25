"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rerunIntelligence, writeThisIdea } from "./actions";
import { RunProgress } from "./RunProgress";
import { UpgradeNotice } from "@/components/UpgradeNotice";

type Keyword = {
  id: string; phrase: string; intent: string;
  difficulty: string | null; kd: number | null; searchVolume: number | null; priority: number; aeoFormat: string | null;
};
type Idea = {
  id: string; title: string; format: string;
  whyNow: string | null; targetAeoQuestion: string | null; rank: number; status: string;
  /** From the linked keyword; drives P1 > P2 > P3 ordering. */
  priority: number;
  /** The piece started from this idea, if there is one. */
  doc: { id: string; status: string; done: boolean } | null;
};
type CompetitorIntel = { competitor: string; topics: string[]; targetKeywords: string[]; weakness: string };
type Trend = { trend: string; opportunity: string };
type Overview = {
  inProgress: { id: string; title: string; status: string }[];
  reviewClaims: number;
  reviewDocs: number;
  coverage: { p1Total: number; p1Covered: number; pct: number };
  freshness: { lastSweepAt: string | null; kwCount: number; ideaCount: number; competitorCount: number; nextSweepDays: number };
  credits: { balance: number; weeklyBurn: number; weeksLeft: number | null; spent30: number; breakdown: { reason: string; credits: number }[] };
};

const RUNNING = new Set([
  "queued", "researching_keywords", "analyzing_competitors",
  "finding_gaps", "finding_aeo", "compiling",
]);


const PRIORITY_BADGE = (p: number) =>
  p <= 1 ? "badge--attention" : p === 2 ? "badge--opportunity" : "badge--draft";

const STATUS_LABEL: Record<string, string> = {
  diagnosing: "Diagnosing", awaiting_confirm: "Needs confirm", generating: "Writing", draft: "Draft",
};
const REASON_LABEL: Record<string, string> = {
  generation: "Generation", regeneration: "Revisions", intelligence_run: "Research",
  repurpose: "Repurpose", diagnosis: "Diagnosis", transcription: "Transcription", adjustment: "Adjustment",
};
const REASON_COLOR: Record<string, string> = {
  generation: "var(--color-accent-strong)", intelligence_run: "var(--color-accent)",
  repurpose: "var(--color-lime)", regeneration: "var(--color-accent-tint)",
  diagnosis: "var(--color-cream)", transcription: "var(--color-navy)", adjustment: "var(--color-muted)",
};
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const svg = (paths: React.ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
);
const ICON = {
  target: svg(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>),
  pencil: svg(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>),
  coin: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.5 2 0 0 1 5 0c0 2.6-5 1.4-5 4a2.5 2 0 0 0 5 0" /></>),
  grid: svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  refresh: svg(<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v5h-5" /></>),
  chart: svg(<><path d="M3 3v18h18" /><path d="M19 7l-5 6-3-3-4 5" /></>),
  sparkle: svg(<><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></>),
};

function CoverageRing({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="flex-none" aria-hidden="true">
      <circle cx="42" cy="42" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
      <circle cx="42" cy="42" r={r} fill="none" stroke="var(--color-accent-strong)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--color-ink-green)"
        style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</text>
    </svg>
  );
}

export function DashboardClient({
  brainName, runId, runStatus, runStartedAt, keywords, ideas, competitorIntel, overview,
}: {
  brainName: string;
  runId: string | null;
  runStatus: string | null;
  runStartedAt: string | null;
  keywords: Keyword[];
  ideas: Idea[];
  competitorIntel: CompetitorIntel[];
  overview: Overview;
}) {
  const router = useRouter();
  const [writing, startWrite] = useTransition();
  const [rerunning, startRerun] = useTransition();
  // Optimistically show progress the instant a run starts, before the next fetch.
  const [started, setStarted] = useState<{ runId: string; at: string } | null>(null);
  // "insufficient_credits" shows the upgrade notice; any other string is shown as-is.
  const [rerunErr, setRerunErr] = useState<string | null>(null);

  const serverRunning = !!runStatus && RUNNING.has(runStatus);
  // Effective progress source: an optimistic just-started run wins over the server snapshot.
  const progress = started
    ? { runId: started.runId, status: "queued", startedAt: started.at }
    : serverRunning && runId
      ? { runId, status: runStatus!, startedAt: runStartedAt }
      : null;

  const rerun = () =>
    startRerun(async () => {
      setRerunErr(null);
      const res = await rerunIntelligence();
      if (res.ok || res.error === "already_running") {
        setStarted({ runId: res.runId!, at: new Date().toISOString() });
      } else if (res.error === "insufficient_credits") {
        setRerunErr("insufficient_credits");
      } else if (res.error === "rate_limited") {
        setRerunErr(`Too many runs right now — try again in about ${res.retryAfterSec ?? 60}s.`);
      } else {
        setRerunErr("Couldn't start a run — finish onboarding first, then try again.");
      }
    });

  const write = (ideaId: string) =>
    startWrite(async () => {
      const { documentId } = await writeThisIdea(ideaId);
      router.push(`/write/${documentId}`);
    });

  // Everything except dismissed stays on the list. Filtering to "suggested" used
  // to make a piece disappear the moment you started it, leaving no way back to
  // the draft short of knowing its URL.
  const freshIdeas = ideas;
  const topIdeas = freshIdeas.slice(0, 3);
  const { inProgress, reviewClaims, reviewDocs, coverage, freshness, credits } = overview;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <span className="eyebrow">{brainName}</span>
        <h1 className="mt-4 text-h2 text-ink-green">Dashboard</h1>
        <p className="mt-2 text-body-sm text-muted">
          Here&apos;s what&apos;s moving{freshness.nextSweepDays ? ` · next sweep in ${freshness.nextSweepDays} days` : ""}.
        </p>
      </div>

      {rerunErr === "insufficient_credits"
        ? <UpgradeNotice className="mt-4" />
        : rerunErr && <p className="mt-4 text-body-sm text-negative">{rerunErr}</p>}

      {/* Live, itemized run progress (optimistic on start, else the server snapshot) */}
      {progress && (
        <RunProgress
          runId={progress.runId}
          initialStatus={progress.status}
          startedAt={progress.startedAt}
          initialCounts={{
            keywords: keywords.length,
            competitors: competitorIntel.length,
            ideas: ideas.length,
          }}
          onDone={() => setStarted(null)}
        />
      )}

      {runStatus === "failed" && (
        <p className="mt-8 rounded-md border border-negative/30 bg-[#FEECEC] px-4 py-3 text-body-sm text-negative">
          The run didn&apos;t finish. It&apos;s usually a transient issue — try running it again from settings.
        </p>
      )}

      {!runStatus && (
        <p className="mt-8 text-muted">Finish onboarding to fire your first intelligence run.</p>
      )}

      {/* ---- Overview: two columns — write/performance (left), ops (right) ---- */}
      <div className="mt-8 grid items-start gap-4 md:grid-cols-2">

        {/* LEFT column: Next to write · Content performance · Answer-box wins */}
        <div className="grid min-w-0 gap-4">

        {/* Next to write (hero) */}
        <section className="btile flex flex-col">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.target} Next to write</span>
            <span className="text-micro text-muted">{freshIdeas.length} ranked</span>
          </div>
          {topIdeas.length === 0 ? (
            <p className="mt-4 flex-1 text-body-sm text-muted">
              Your ranked ideas appear here once the intelligence run finishes.
            </p>
          ) : (
            <ul className="mt-4 grid flex-1 content-start gap-3">
              {topIdeas.map((i) => (
                <li key={i.id} className="flex items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                  <span className={`badge ${PRIORITY_BADGE(i.priority)} mt-0.5 flex-none`}>P{i.priority}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-body-sm font-semibold text-ink-green">{i.title}</p>
                    <p className="mt-1 line-clamp-3 text-micro text-muted">
                      {i.format.replaceAll("_", " ")}{i.whyNow ? ` · ${i.whyNow}` : ""}
                    </p>
                  </div>
                  {i.doc === null ? (
                    <button
                      className="flex-none rounded-pill bg-lime px-4 py-2 text-caption font-semibold text-ink-green disabled:opacity-60"
                      disabled={writing}
                      onClick={() => write(i.id)}
                    >
                      {writing ? "…" : "Write"}
                    </button>
                  ) : i.doc.done ? (
                    <a href={`/write/${i.doc.id}`} className="flex-none self-center text-caption font-semibold text-positive">Done</a>
                  ) : (
                    <a href={`/write/${i.doc.id}`} className="flex-none self-center text-caption font-semibold text-accent-strong">Open →</a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {freshIdeas.length > topIdeas.length && (
            <a href="/content" className="mt-4 pt-1 text-caption font-semibold text-accent-strong">
              See all {freshIdeas.length} ideas →
            </a>
          )}
        </section>

        {/* Content performance — Tier 2, awaiting the Search Console connection */}
        <section className="btile btile--soon">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.chart} Content performance</span>
            <span className="text-micro text-muted">Soon</span>
          </div>
          <p className="mt-3 text-body-sm text-muted">
            Clicks, impressions and average position for the pages Mavrix publishes.
          </p>
          <a href="/performance" className="mt-3 inline-block text-caption font-semibold text-accent-strong">
            Connect Search Console →
          </a>
        </section>

        {/* Answer-box wins — Tier 2, awaiting the Search Console connection */}
        <section className="btile btile--soon">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.sparkle} Answer-box wins</span>
            <span className="text-micro text-muted">Soon</span>
          </div>
          <p className="mt-3 text-body-sm text-muted">
            Featured snippets and AI-answer citations your published pieces earn.
          </p>
          <a href="/performance" className="mt-3 inline-block text-caption font-semibold text-accent-strong">
            Connect Search Console →
          </a>
        </section>

        </div>

        {/* RIGHT column: In progress · Credits · Research engine · P1 coverage */}
        <div className="grid min-w-0 gap-4">

        {/* In progress + fact-check review */}
        <section className="btile">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.pencil} In progress</span>
            <span className="text-micro text-muted">{inProgress.length ? `${inProgress.length} in flight` : "none"}</span>
          </div>
          {inProgress.length === 0 ? (
            <p className="mt-3 text-body-sm text-muted">No drafts in flight. Start one from an idea.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {inProgress.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-body-sm">
                  <span className="badge badge--draft flex-none">{STATUS_LABEL[d.status] ?? d.status}</span>
                  <span className="min-w-0 flex-1 truncate text-ink">{d.title}</span>
                  <a href={`/write/${d.id}`} className="flex-none text-caption font-semibold text-accent-strong">Open</a>
                </li>
              ))}
            </ul>
          )}
          {reviewClaims > 0 && (
            <p className="mt-3 text-caption text-ink">
              <span className="badge badge--attention mr-2">{reviewClaims} to review</span>
              fact-check {reviewClaims === 1 ? "item" : "items"} to confirm before publishing
              {reviewDocs > 1 ? ` across ${reviewDocs} drafts` : ""}.
            </p>
          )}
        </section>

        {/* Credits & burn */}
        <section className="btile">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.coin} Credits</span>
            <a href="/billing" className="text-caption font-semibold text-accent-strong">Top up →</a>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-h3 tabular-nums text-ink-green">{credits.balance}</span>
            <span className="text-caption text-muted">
              {credits.weeksLeft == null
                ? "balance"
                : credits.weeksLeft > 52
                  ? "over a year at your pace"
                  : `about ${credits.weeksLeft} weeks at your pace`}
            </span>
          </div>
          {credits.breakdown.length > 0 ? (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-pill bg-bg-alt">
                {credits.breakdown.map((b) => (
                  <span key={b.reason} style={{ width: `${(b.credits / credits.spent30) * 100}%`, background: REASON_COLOR[b.reason] ?? "var(--color-muted)" }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-micro text-muted">
                {credits.breakdown.slice(0, 4).map((b) => (
                  <span key={b.reason} className="inline-flex items-center gap-1.5">
                    <span style={{ background: REASON_COLOR[b.reason] ?? "var(--color-muted)", width: 8, height: 8, borderRadius: 9999, display: "inline-block" }} />
                    {REASON_LABEL[b.reason] ?? b.reason} {Math.round((b.credits / credits.spent30) * 100)}%
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-body-sm text-muted">No spend in the last 30 days.</p>
          )}
        </section>

        {/* Research engine freshness */}
        <section className="btile">
          <div className="flex items-center justify-between">
            <span className="btile-label">{ICON.refresh} Research engine</span>
            <span className="text-micro text-muted">last sweep {fmtDate(freshness.lastSweepAt)}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-h4 tabular-nums text-ink-green">{freshness.kwCount}</div><div className="text-micro text-muted">keywords</div></div>
            <div><div className="text-h4 tabular-nums text-ink-green">{freshness.ideaCount}</div><div className="text-micro text-muted">ideas</div></div>
            <div><div className="text-h4 tabular-nums text-ink-green">{freshness.competitorCount}</div><div className="text-micro text-muted">competitors</div></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {progress ? (
              <span className="text-caption text-muted">A run is in progress…</span>
            ) : (
              <>
                <button
                  className="rounded-pill border border-line px-4 py-2 text-caption font-semibold text-ink-green disabled:opacity-60"
                  disabled={rerunning}
                  onClick={rerun}
                  title="Runs a fresh intelligence report on your domain (100 credits)"
                >
                  {rerunning ? "Starting…" : "↻ Run now"}
                </button>
                <span className="text-micro text-muted">auto in {freshness.nextSweepDays} days</span>
              </>
            )}
          </div>
        </section>

        {/* P1 coverage */}
        <section className="btile flex items-center gap-5">
          <CoverageRing pct={coverage.pct} />
          <div className="min-w-0">
            <span className="btile-label">{ICON.grid} P1 coverage</span>
            <p className="mt-2 text-body-sm font-semibold text-ink-green">
              {coverage.p1Covered} of {coverage.p1Total} P1 keywords
            </p>
            <p className="mt-1 text-caption text-muted">
              {Math.max(0, coverage.p1Total - coverage.p1Covered)} opportunities still open.
            </p>
            <a href="/audit" className="mt-2 inline-block text-caption font-semibold text-accent-strong">See the gap →</a>
          </div>
        </section>

        </div>

      </div>

    </main>
  );
}
