"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getDocState, confirmAndGenerate, regenerate } from "../actions";
import { ExportPanel } from "./ExportPanel";
import { WriterProgress } from "./WriterProgress";
import { UpgradeNotice } from "@/components/UpgradeNotice";

type Diagnosis = {
  coreMessage: string;
  recommendedTitle: string;
  targetKeyword?: string;
  targetAeoQuestion?: string;
  whyThisFormat: string;
  alternative?: { title: string; format: string; why: string };
};
type Brief = {
  wordCount: number;
  primaryKeyword?: string;
  secondaryKeywords: string[];
  targetAeoQuestion?: string;
  metaDescription: string;
  altTexts: string[];
  valuesReflected: string[];
  terminologyCheckPassed: boolean;
  voiceChecksPassed: boolean;
  terminologyViolations?: { found: string; useInstead: string }[];
  factCheck?: {
    checkedCount: number;
    removed: { claim: string; type: string; verdict: string; note?: string }[];
    flagged: { claim: string; type: string; note?: string }[];
  };
};
type State = {
  status: string;
  format: string;
  diagnosis: Diagnosis | null;
  title: string | null;
  bodyMarkdown: string | null;
  brief: Brief | null;
  updatedAt: string | null;
  sourceStatus?: string | null;
  sourceError?: string | null;
};

const fmt = (s: string) => s.replaceAll("_", " ");
const WORKING = new Set(["diagnosing", "generating"]);

export function WriterFlow({
  documentId, brainName, initial, initialExports,
}: {
  documentId: string;
  brainName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initial: any;
  initialExports: { id: string; kind: string; content: string }[];
}) {
  const [s, setS] = useState<State>(initial);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  // updatedAt of the document when we kicked off a (re)generation. A terminal
  // status whose updatedAt still matches this is the *pre-generation* snapshot —
  // the job just hasn't marked itself running yet — so we ignore it rather than
  // let it revert the optimistic "generating" view (and stop the poll).
  const genBaseline = useRef<string | null>(null);

  useEffect(() => {
    if (!WORKING.has(s.status)) return;
    const t = setInterval(async () => {
      const next = await getDocState(documentId);
      if (WORKING.has(next.status)) { setS(next); return; } // live working status
      if (genBaseline.current !== null && next.updatedAt === genBaseline.current) return; // stale — keep waiting
      setS(next); // a genuinely new terminal result
    }, 2500);
    return () => clearInterval(t);
  }, [s.status, documentId]);

  const beginGeneration = () => {
    genBaseline.current = s.updatedAt ?? null;
    setS((p) => ({ ...p, status: "generating" })); // urgent — flip the view now
  };

  const [err, setErr] = useState<string | null>(null);

  const confirm = (useAlt: boolean) => {
    const prev = s.status;
    setErr(null);
    beginGeneration();
    start(async () => {
      const res = await confirmAndGenerate(documentId, useAlt);
      if (!res.ok) { setErr(res.error); setS((p) => ({ ...p, status: prev })); }
    });
  };

  const rerun = () => {
    const prev = s.status;
    setErr(null);
    beginGeneration();
    start(async () => {
      const res = await regenerate(documentId, note);
      if (res.ok) setNote("");
      else { setErr(res.error); setS((p) => ({ ...p, status: prev })); }
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <span className="eyebrow">{brainName} · Writer</span>

      {err === "insufficient_credits"
        ? <UpgradeNotice className="mt-4" />
        : err && <p className="mt-4 text-body-sm text-negative">{err}</p>}

      {/* Working states — live progress feed */}
      {WORKING.has(s.status) && <WriterProgress documentId={documentId} phase={s.status} />}

      {/* Diagnosis card */}
      {s.status === "awaiting_confirm" && s.diagnosis && (
        <div className="mt-6 grid gap-4">
          <h1 className="text-h3 text-ink-green">Here&apos;s what this should become</h1>
          <div className="card--lg card">
            <span className="badge badge--opportunity">{fmt(s.format)}</span>
            <h2 className="mt-3 text-h4 text-ink-green">{s.diagnosis.recommendedTitle}</h2>
            <p className="mt-3 text-body-sm text-ink">{s.diagnosis.coreMessage}</p>

            <div className="mt-4 grid gap-2 border-t border-line pt-4 text-body-sm">
              {s.diagnosis.targetKeyword && (
                <p><span className="text-muted">Target keyword:</span> <span className="text-ink-green">{s.diagnosis.targetKeyword}</span></p>
              )}
              {s.diagnosis.targetAeoQuestion && (
                <p><span className="text-muted">Answers:</span> “{s.diagnosis.targetAeoQuestion}”</p>
              )}
              <p className="text-muted">{s.diagnosis.whyThisFormat}</p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn-accent" disabled={pending} onClick={() => confirm(false)}>
                Write it
              </button>
              {s.diagnosis.alternative && (
                <button className="btn-ghost" disabled={pending} onClick={() => confirm(true)}>
                  Write the alternative: {fmt(s.diagnosis.alternative.format)}
                </button>
              )}
            </div>
            {s.diagnosis.alternative && (
              <p className="mt-2 text-micro text-muted">
                Alternative — {s.diagnosis.alternative.title}: {s.diagnosis.alternative.why}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Editor + brief */}
      {(s.status === "draft" || s.status === "final") && s.bodyMarkdown && (
        <>
        {s.brief?.factCheck && <FactCheckPanel fc={s.brief.factCheck} />}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <span className="mr-auto text-caption text-muted">Draft ready. Edit below, or regenerate.</span>
          <button className="btn-ghost" disabled={pending} onClick={() => confirm(false)}>
            Regenerate from scratch
          </button>
          <span className="text-micro text-muted">20 credits</span>
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
          <article>
            <h1 className="text-h3 text-ink-green">{s.title}</h1>
            <div className="mt-5 whitespace-pre-wrap text-body leading-relaxed text-ink">{s.bodyMarkdown}</div>

            <div className="mt-8 border-t border-line pt-6">
              <h3 className="text-h5 text-ink-green">Not quite right?</h3>
              <p className="mt-1 text-caption text-muted">
                Tweak this draft with a note, or rewrite the whole piece from your original source.
              </p>
              <textarea
                className="input mt-3"
                rows={3}
                placeholder="Tell Mavrix what to change — 'tighten the intro', 'more concrete examples', 'warmer tone'…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="btn-primary" disabled={pending || !note.trim()} onClick={rerun}>
                  Regenerate with this note
                </button>
                <span className="text-micro text-muted">2 credits</span>
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-body-sm text-ink">Rewrite from scratch</p>
                <p className="mt-1 text-caption text-muted">
                  Rebuilds the piece from your original source using the latest engine. Use this to restore anything an earlier version dropped.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button className="btn-ghost" disabled={pending} onClick={() => confirm(false)}>
                    Regenerate from scratch
                  </button>
                  <span className="text-micro text-muted">20 credits</span>
                </div>
              </div>
            </div>
          </article>

          {s.brief && <BriefPanel brief={s.brief} />}
        </div>
        <ExportPanel documentId={documentId} initialExports={initialExports} />
        </>
      )}

      {/* Failure — source prep (e.g. transcription) or generation errored. Shows
          the reason and a way out, instead of the blank page it used to be. */}
      {(s.status === "failed" || s.sourceStatus === "failed") && (
        <div className="card--lg card mt-6 border-negative/30">
          <span className="badge badge--attention">Couldn&apos;t process this</span>
          <h1 className="mt-3 text-h4 text-ink-green">This piece didn&apos;t get off the ground</h1>
          <p className="mt-3 text-body-sm text-ink">
            {s.sourceError ?? "Something went wrong preparing your source."}
          </p>
          <p className="mt-2 text-caption text-muted">
            Any credits charged for this have been refunded.
          </p>
          <a href="/write" className="btn-accent mt-5 inline-block">Start a new piece →</a>
        </div>
      )}

      {/* Catch-all: never render a blank page. Covers "archived" and any status
          without a branch above. */}
      {!WORKING.has(s.status)
        && s.status !== "awaiting_confirm"
        && s.status !== "draft" && s.status !== "final"
        && s.status !== "failed" && s.sourceStatus !== "failed" && (
        <div className="card mt-6">
          <p className="text-body-sm text-muted">
            This piece isn&apos;t available to view right now.
          </p>
          <a href="/write" className="btn-ghost mt-4 inline-block">Back to Write</a>
        </div>
      )}
    </main>
  );
}

function FactCheckPanel({ fc }: { fc: NonNullable<Brief["factCheck"]> }) {
  const nothing = fc.removed.length === 0 && fc.flagged.length === 0;
  return (
    <div className="card mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow eyebrow--cream">Fact check</span>
        <span className="text-caption text-muted">
          {fc.checkedCount} specific claim{fc.checkedCount === 1 ? "" : "s"} verified against the web and your site
        </span>
      </div>

      {nothing ? (
        <p className="mt-3 text-body-sm text-ink">Every specific claim checked out. Still worth a human read before publishing.</p>
      ) : (
        <div className="mt-4 grid gap-5">
          {fc.removed.length > 0 && (
            <div>
              <h3 className="text-h5 text-ink-green">
                Removed from the draft <span className="badge badge--attention ml-1">{fc.removed.length}</span>
              </h3>
              <p className="mt-1 text-caption text-muted">
                These were fabricated or out of date, so Mavrix took them out. Add a verified figure back if you have one.
              </p>
              <ul className="mt-3 space-y-2">
                {fc.removed.map((c, i) => (
                  <li key={i} className="border-l-2 border-negative pl-3 text-body-sm">
                    <span className="text-ink">{c.claim}</span>
                    {c.note && <span className="block text-caption text-muted">{c.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fc.flagged.length > 0 && (
            <div>
              <h3 className="text-h5 text-ink-green">
                Check before publishing <span className="badge badge--queued ml-1">{fc.flagged.length}</span>
              </h3>
              <p className="mt-1 text-caption text-muted">
                Mavrix could not confirm these either way. They are still in the draft, verify or cut them.
              </p>
              <ul className="mt-3 space-y-2">
                {fc.flagged.map((c, i) => (
                  <li key={i} className="border-l-2 border-line pl-3 text-body-sm">
                    <span className="text-ink">{c.claim}</span>
                    {c.note && <span className="block text-caption text-muted">{c.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefPanel({ brief }: { brief: Brief }) {
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-t border-line py-3 first:border-t-0">
      <p className="text-micro font-medium text-muted">{label}</p>
      <div className="mt-1 text-caption text-ink">{children}</div>
    </div>
  );
  return (
    <aside className="card h-fit md:sticky md:top-8">
      <span className="eyebrow eyebrow--cream">Content brief</span>
      <div className="mt-4">
        <Row label="Word count">{brief.wordCount}</Row>
        {brief.primaryKeyword && <Row label="Primary keyword">{brief.primaryKeyword}</Row>}
        {brief.secondaryKeywords?.length > 0 && (
          <Row label="Secondary keywords">{brief.secondaryKeywords.join(" · ")}</Row>
        )}
        {brief.targetAeoQuestion && <Row label="AEO question">{brief.targetAeoQuestion}</Row>}
        <Row label="Meta description">{brief.metaDescription}</Row>
        <Row label="Alt text">
          <ul className="grid gap-1">{brief.altTexts?.map((a, i) => <li key={i}>• {a}</li>)}</ul>
        </Row>
        <Row label="Values reflected">
          {brief.valuesReflected?.map((v) => <span key={v} className="badge badge--draft mr-1 mb-1">{v}</span>)}
        </Row>
        <Row label="Terminology check">
          {brief.terminologyCheckPassed ? (
            <span className="badge badge--published">clean</span>
          ) : (
            <div>
              <span className="badge badge--attention">{brief.terminologyViolations?.length ?? 0} to fix</span>
              <ul className="mt-2 grid gap-1 text-micro text-negative">
                {brief.terminologyViolations?.map((v, i) => (
                  <li key={i}>“{v.found}” → use “{v.useInstead}”</li>
                ))}
              </ul>
            </div>
          )}
        </Row>
      </div>
    </aside>
  );
}
