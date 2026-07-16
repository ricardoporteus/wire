"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRunStatus, type FeedEvent } from "./actions";

type Counts = { keywords: number; competitors: number; ideas: number };

/**
 * Live, real-time view of an intelligence run. Polls a fast cursor feed and
 * streams every real action — each web search, each batch of sources read, each
 * synthesis/refine, each save — into an auto-scrolling activity log, with a
 * stage checklist, ticking counters and an elapsed timer. Meant to be watched:
 * it makes the "lightning-speed research" visible instead of a frozen spinner.
 */

const STAGES = [
  { key: "researching_keywords", title: "Researching keywords" },
  { key: "analyzing_competitors", title: "Analyzing competitors" },
  { key: "finding_gaps", title: "Finding content gaps" },
  { key: "finding_aeo", title: "Answer-engine opportunities" },
  { key: "compiling", title: "Compiling your plan" },
];
const ORDER = STAGES.map((s) => s.key);
const TERMINAL = new Set(["complete", "failed", "unknown"]);

const KIND_ICON: Record<string, string> = {
  search: "🔍",
  sources: "📄",
  synthesize: "🧠",
  refine: "↻",
  stage: "▸",
  saved: "✓",
  info: "✦",
  error: "⚠",
};

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
  onDone,
}: {
  runId: string;
  initialStatus: string;
  startedAt: string | null;
  initialCounts: Counts;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [lastEventAt, setLastEventAt] = useState(() => Date.now());

  const seqRef = useRef(0);
  const startMs = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());
  const feedRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (doneRef.current || inFlight.current) return; // no overlapping polls → no dup events
    inFlight.current = true;
    try {
      const since = seqRef.current;
      const res = await getRunStatus(runId, since);
      setStatus(res.status);
      setCounts(res.counts);
      if (res.startedAt) startMs.current = new Date(res.startedAt).getTime();
      if (res.events.length && res.maxSeq > since) {
        seqRef.current = res.maxSeq;
        setEvents((prev) => [...prev, ...res.events].slice(-200));
        setLastEventAt(Date.now());
      }
      if (TERMINAL.has(res.status)) {
        doneRef.current = true;
        // Let the last "report ready" line land, then clear the optimistic run and
        // reveal the full dashboard. onDone must fire with the refresh so this
        // component unmounts instead of re-detecting "complete" and looping.
        setTimeout(() => { onDone?.(); router.refresh(); }, 1400);
      }
    } finally {
      inFlight.current = false;
    }
  }, [runId, router, onDone]);

  // Fast poll for a lively feed; an immediate first poll avoids an empty beat.
  useEffect(() => {
    poll();
    const t = setInterval(poll, 1200);
    return () => clearInterval(t);
  }, [poll]);

  // Tick the elapsed timer / stall detector once a second.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keep the feed pinned to the newest line.
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  const activeIdx = status === "complete" ? ORDER.length : ORDER.indexOf(status);
  const pct = Math.round((Math.max(0, activeIdx) / ORDER.length) * 100);

  // Counters derived from the feed the client has already accumulated.
  const searches = useMemo(() => events.filter((e) => e.kind === "search").length, [events]);
  const sources = useMemo(
    () => events.filter((e) => e.kind === "sources").reduce((n, e) => n + (e.count ?? 0), 0),
    [events],
  );

  const failed = status === "failed";
  const secsSinceEvent = Math.floor((now - lastEventAt) / 1000);
  const stalled = !failed && !doneRef.current && events.length > 0 && secsSinceEvent > 20;

  return (
    <div className="card--lg card mt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${failed ? "bg-negative" : "animate-pulse bg-accent-strong"}`} />
          <span className="text-h5 text-ink-green">
            {failed ? "Run stopped" : doneRef.current ? "Report ready — loading…" : "Building your intelligence report"}
          </span>
        </div>
        <span className="tabular-nums text-caption text-muted">
          {fmtElapsed(startMs.current, now)} · {pct}%
        </span>
      </div>

      {/* progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-line">
        <div
          className={`h-full rounded-pill transition-all duration-500 ${failed ? "bg-negative" : "bg-accent-strong"}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      {/* ticking counters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Stat n={searches} label="searches" />
        <Stat n={sources} label="sources read" />
        <Stat n={counts.keywords} label="keywords" />
        <Stat n={counts.competitors} label="competitors" />
        <Stat n={counts.ideas} label="ideas" />
      </div>

      {/* live activity feed */}
      <div
        ref={feedRef}
        className="mt-4 h-56 overflow-y-auto rounded-md border border-line bg-bg/60 p-3 font-mono text-micro leading-relaxed"
      >
        {events.length === 0 ? (
          <p className="text-muted">Warming up the research agent…</p>
        ) : (
          events.map((e) => (
            <div key={e.seq} className="feed-line flex gap-2 py-0.5">
              <span className="flex-none opacity-80">{KIND_ICON[e.kind] ?? "·"}</span>
              <span className="min-w-0">
                <span className={e.kind === "search" ? "text-ink-green" : e.kind === "saved" ? "text-accent-strong" : "text-ink"}>
                  {e.message}
                </span>
                {e.titles && e.titles.length > 0 && (
                  <span className="text-muted"> — {e.titles.join(" · ")}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="mt-2 text-caption text-muted">
        {failed
          ? "The run didn't finish — usually transient. You can re-run it from Settings."
          : stalled
            ? `Still working — last activity ${secsSinceEvent}s ago (a deep search stage can take a moment).`
            : "Running live on your own domain. Every line above is a real action the agent just took."}
      </p>

      {/* compact stage strip */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {STAGES.map((s, i) => {
          const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
          return (
            <span
              key={s.key}
              className={`text-micro ${state === "done" ? "text-accent-strong" : state === "active" ? "font-medium text-ink-green" : "text-muted"}`}
            >
              {state === "done" ? "✓ " : state === "active" ? "▸ " : "○ "}
              {s.title}
            </span>
          );
        })}
      </div>

      <style>{`
        .feed-line { animation: feedIn 240ms ease-out; }
        @keyframes feedIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-pill bg-accent-tint px-3 py-1 text-caption text-ink-green">
      <span className="tabular-nums font-semibold">{n}</span> <span className="text-muted">{label}</span>
    </span>
  );
}
