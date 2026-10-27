"use client";

/**
 * Batch progress + download. Polls getBatchState every 2s while the run is
 * writing; once done, shows the completion banner and the download bundle
 * ("Download all" zip + per-article MD / HTML / Word). Writing happens in the
 * background, so you can leave this page — the completion email still fires.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getBatchState, type BatchState } from "../../bulk-actions";

const DOC_STATUS_LABEL: Record<string, string> = {
  diagnosing: "Queued", awaiting_confirm: "Queued", generating: "Writing…",
  draft: "Done", final: "Done", failed: "Failed", archived: "Archived",
};

export function BatchClient({ batchId, initial }: { batchId: string; initial: BatchState }) {
  const [state, setState] = useState<BatchState>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status !== "writing") return;
    let cancelled = false;
    const tick = async () => {
      const next = await getBatchState(batchId);
      if (cancelled) return;
      setState(next);
      if (next.status === "writing") timer.current = setTimeout(tick, 2000);
    };
    timer.current = setTimeout(tick, 2000);
    return () => { cancelled = true; if (timer.current) clearTimeout(timer.current); };
  }, [batchId, state.status]);

  const done = state.status !== "writing";
  const pct = state.total ? Math.round((state.settledCount / state.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/content" className="text-caption font-semibold text-accent-strong">← Content</Link>
      <span className="eyebrow mt-4 block">Bulk writer</span>

      {done ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-ink-green)] px-4 py-3 text-cream">
          <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-lime text-ink-green">✓</span>
          <p className="text-body-sm">
            {state.readyCount} article{state.readyCount === 1 ? " is" : "s are"} ready to download
            {state.readyCount !== state.total && ` · ${state.total - state.readyCount} didn't finish`}.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-h2 text-ink-green">Writing {state.total} article{state.total === 1 ? "" : "s"}…</h1>
          <p className="mt-2 text-body-sm text-muted">
            Quill is writing these in the background — you can leave this page. We&apos;ll email you when they&apos;re done.
          </p>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-caption text-muted">{state.settledCount} of {state.total} done</p>
        </>
      )}

      {done && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h4 text-ink-green">Your finished pieces</h2>
          {state.readyCount > 0 && (
            <a className="btn-primary" href={`/content/batch/${batchId}/download`}>Download all (.zip)</a>
          )}
        </div>
      )}

      <div className={`${done ? "mt-4" : "mt-6"} flex flex-col gap-2`}>
        {state.docs.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <h3 className="min-w-0 truncate text-body-sm font-semibold text-ink-green">{d.title}</h3>
              <p className="mt-0.5 text-micro text-muted">
                {d.wordCount ? `${d.wordCount.toLocaleString()} words` : DOC_STATUS_LABEL[d.status] ?? d.status}
              </p>
            </div>
            {d.ok ? (
              <div className="flex flex-none gap-2">
                <a className="btn-ghost px-3 py-1.5 text-caption" href={`/write/${d.id}/export?format=markdown`}>MD</a>
                <a className="btn-ghost px-3 py-1.5 text-caption" href={`/write/${d.id}/export?format=html`}>HTML</a>
                <a className="btn-ghost px-3 py-1.5 text-caption" href={`/write/${d.id}/export?format=docx`}>DOC</a>
                <Link className="btn-ghost px-3 py-1.5 text-caption" href={`/write/${d.id}`}>Open</Link>
              </div>
            ) : d.failed ? (
              <span className="badge badge--attention flex-none">Failed</span>
            ) : (
              <span className="flex flex-none items-center gap-2 font-mono text-micro text-accent-strong">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-accent-strong" />
                {DOC_STATUS_LABEL[d.status] ?? d.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
