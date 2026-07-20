"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDocFeed, type DocFeedEvent } from "../actions";

/**
 * Live progress for the writer. Diagnosis is quick (an indeterminate bar + a
 * couple of feed lines); generation streams, so we show a climbing word count,
 * a progress bar, and the activity feed — visible motion instead of a frozen
 * "Writing…" card. WriterFlow owns the state transition; this only renders while
 * the document is in a working status and unmounts when it lands.
 */

const KIND_ICON: Record<string, string> = {
  stage: "▸", writing: "✍️", saved: "✓", info: "✦", error: "⚠",
};
const TARGET_WORDS = 1200; // rough denominator for the generation bar (asymptotic, capped < 100%)

/**
 * The steps each phase actually walks through, keyed to the `stage` the pipeline
 * stamps on its events. Keys rather than message text, so rewording a status
 * line cannot silently break the strip.
 */
const PHASE_STAGES: Record<"diagnose" | "generate", { key: string; title: string }[]> = {
  diagnose: [
    { key: "intel", title: "Pulling intelligence" },
    { key: "angle", title: "Diagnosing the angle" },
    { key: "ready", title: "Plan ready" },
  ],
  generate: [
    { key: "grounding", title: "Grounding in your brand" },
    { key: "writing", title: "Writing the draft" },
    { key: "checking", title: "Checking terminology & voice" },
    { key: "ready", title: "Draft ready" },
  ],
};

function fmtElapsed(fromMs: number, nowMs: number) {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function WriterProgress({ documentId, phase }: { documentId: string; phase: string }) {
  const [events, setEvents] = useState<DocFeedEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [lastEventAt, setLastEventAt] = useState(() => Date.now());
  const seqRef = useRef(0);
  const startRef = useRef(Date.now());
  const feedRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (inFlight.current) return; // no overlapping polls → no dup events
    inFlight.current = true;
    try {
      const since = seqRef.current;
      const res = await getDocFeed(documentId, since);
      if (res.events.length && res.maxSeq > since) {
        seqRef.current = res.maxSeq;
        setEvents((prev) => [...prev, ...res.events].slice(-150));
        setLastEventAt(Date.now());
      }
    } finally {
      inFlight.current = false;
    }
  }, [documentId]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [poll]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  const diagnosing = phase === "diagnosing";
  const words = useMemo(
    () => events.reduce((m, e) => (e.words && e.words > m ? e.words : m), 0),
    [events],
  );
  const pct = diagnosing ? 0 : Math.min(95, Math.round((words / TARGET_WORDS) * 100));
  const secsSinceEvent = Math.floor((now - lastEventAt) / 1000);
  const stalled = events.length > 0 && secsSinceEvent > 20;

  // Furthest stage reached. A "saved" event means the phase finished, which is
  // the only way the final step lights up: the pipeline has no "ready" stage
  // event of its own.
  const stages = PHASE_STAGES[diagnosing ? "diagnose" : "generate"];
  const activeIdx = useMemo(() => {
    if (events.some((e) => e.kind === "saved")) return stages.length - 1;
    let idx = 0;
    for (const e of events) {
      if (!e.stage) continue;
      const i = stages.findIndex((s) => s.key === e.stage);
      if (i > idx) idx = i;
    }
    return idx;
  }, [events, stages]);

  return (
    <div className="card--lg card mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-strong" />
          <span className="text-h5 text-ink-green">
            {diagnosing ? "Reading your source and diagnosing…" : "Writing your draft…"}
          </span>
        </div>
        <span className="tabular-nums text-caption text-muted">
          {fmtElapsed(startRef.current, now)}{!diagnosing && words > 0 ? ` · ${words} words` : ""}
        </span>
      </div>

      {/* progress bar — indeterminate for diagnosis, word-driven for generation */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-line">
        {diagnosing ? (
          <div className="wp-indeterminate h-full w-1/3 rounded-pill bg-accent-strong" />
        ) : (
          <div
            className="h-full rounded-pill bg-accent-strong transition-all duration-500"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        )}
      </div>

      {/* live activity feed */}
      <div
        ref={feedRef}
        className="mt-4 max-h-44 overflow-y-auto rounded-md border border-line bg-bg/60 p-3 font-mono text-micro leading-relaxed"
      >
        {events.length === 0 ? (
          <p className="text-muted">{diagnosing ? "Reading your source…" : "Warming up the writer…"}</p>
        ) : (
          events.map((e) => (
            <div key={e.seq} className="feed-line flex gap-2 py-0.5">
              <span className="flex-none opacity-80">{KIND_ICON[e.kind] ?? "·"}</span>
              <span className={e.kind === "saved" ? "text-accent-strong" : e.kind === "writing" ? "text-ink-green" : "text-ink"}>
                {e.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* compact stage strip — mirrors the intelligence run's, so both feeds read the same way */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {stages.map((s, i) => {
          const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
          return (
            <span
              key={s.key}
              className={`text-micro ${
                state === "done" ? "text-accent-strong"
                : state === "active" ? "font-medium text-ink-green"
                : "text-muted"
              }`}
            >
              {state === "done" ? "✓ " : state === "active" ? "▸ " : "○ "}
              {s.title}
            </span>
          );
        })}
      </div>

      <p className="mt-2 text-caption text-muted">
        {stalled
          ? `Still working — no update for ${secsSinceEvent}s. A slow model response can stall briefly; it retries automatically.`
          : diagnosing
            ? "Deciding what this should become — format, angle, and the keyword to target from your live intelligence."
            : "Generating on-brand, SEO- and AEO-optimized copy, then running the terminology lint pass."}
      </p>

      <style>{`
        .feed-line { animation: feedIn 240ms ease-out; }
        @keyframes feedIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
        .wp-indeterminate { animation: wpSlide 1.1s ease-in-out infinite; }
        @keyframes wpSlide { 0% { margin-left: -34%; } 100% { margin-left: 100%; } }
      `}</style>
    </div>
  );
}
