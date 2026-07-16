"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRunStatus } from "./actions";

type Counts = { keywords: number; competitors: number; ideas: number };

/**
 * Live, itemized progress for an intelligence run — the pipeline advances its
 * status through these stages in order (see runStatus enum), so we render a
 * checklist that checks each one off as it lands, with real result counts, a
 * progress bar and an elapsed timer. Polls until the run reaches a terminal
 * state, then refreshes the page to pull in the full report.
 */
type Stage = {
  key: string;
  title: string;
  desc: string;
  count: ((c: Counts) => number) | null;
  noun: string;
};

const STAGES: Stage[] = [
  {
    key: "researching_keywords",
    title: "Researching keywords",
    desc: "Searching the live web for high-intent, informational, long-tail and question keywords.",
    count: (c) => c.keywords,
    noun: "keywords",
  },
  {
    key: "analyzing_competitors",
    title: "Analyzing competitors",
    desc: "Reading competitor content to map what they rank for — and where they're weak.",
    count: (c) => c.competitors,
    noun: "competitors",
  },
  {
    key: "finding_gaps",
    title: "Finding content gaps",
    desc: "Cross-referencing competitor coverage against your positioning to find openings.",
    count: null,
    noun: "",
  },
  {
    key: "finding_aeo",
    title: "Finding answer-engine opportunities",
    desc: "Identifying featured-snippet and AI-answer questions you can own.",
    count: null,
    noun: "",
  },
  {
    key: "compiling",
    title: "Compiling your plan",
    desc: "Ranking everything into your prioritized content queue.",
    count: (c) => c.ideas,
    noun: "ideas",
  },
];

const ORDER = STAGES.map((s) => s.key);
const TERMINAL = new Set(["complete", "failed", "unknown"]);

function fmtElapsed(fromMs: number, nowMs: number) {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function RunProgress({
  runId,
  initialStatus,
  startedAt,
  initialCounts,
}: {
  runId: string;
  initialStatus: string;
  startedAt: string | null;
  initialCounts: Counts;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [now, setNow] = useState(() => Date.now());
  const startMs = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());

  // Poll the run; advance the checklist live; refresh the page when it lands.
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await getRunStatus(runId);
      setStatus(res.status);
      setCounts(res.counts);
      if (res.startedAt) startMs.current = new Date(res.startedAt).getTime();
      if (TERMINAL.has(res.status)) {
        clearInterval(t);
        router.refresh();
      }
    }, 2500);
    return () => clearInterval(t);
  }, [runId, router]);

  // Tick the elapsed timer once a second.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Everything before the current stage is done; the current one is active.
  const activeIdx = status === "complete" ? ORDER.length : ORDER.indexOf(status);
  const doneCount = Math.max(0, activeIdx);
  const pct = Math.round((doneCount / ORDER.length) * 100);

  return (
    <div className="card--lg card mt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-strong" />
          <span className="text-h5 text-ink-green">Building your intelligence report</span>
        </div>
        <span className="tabular-nums text-caption text-muted">
          {fmtElapsed(startMs.current, now)} · {pct}%
        </span>
      </div>
      <p className="mt-2 text-body-sm text-muted">
        Running live on your own domain — each step checks off as it lands. This is the product working.
      </p>

      {/* progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-line">
        <div
          className="h-full rounded-pill bg-accent-strong transition-all duration-500"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      {/* itemized steps */}
      <ol className="mt-6 grid gap-4">
        {STAGES.map((s, i) => {
          const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
          const n = s.count ? s.count(counts) : null;
          return (
            <li key={s.key} className="flex gap-3">
              <span className="mt-0.5 flex-none">
                {state === "done" ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-strong text-[11px] font-bold text-white">
                    ✓
                  </span>
                ) : state === "active" ? (
                  <span className="block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent-strong" />
                ) : (
                  <span className="block h-5 w-5 rounded-full border-2 border-line" />
                )}
              </span>
              <div className="min-w-0">
                <p className={`text-body-sm font-medium ${state === "pending" ? "text-muted" : "text-ink-green"}`}>
                  {s.title}
                  {state === "done" && n !== null && n > 0 && (
                    <span className="badge badge--opportunity ml-2">
                      {n} {s.noun}
                    </span>
                  )}
                </p>
                {state !== "pending" && <p className="mt-0.5 text-caption text-muted">{s.desc}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
