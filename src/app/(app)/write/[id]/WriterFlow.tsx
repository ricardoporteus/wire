"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getDocState, confirmAndGenerate, regenerate } from "../actions";
import { ExportPanel } from "./ExportPanel";
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
};
type State = {
  status: string;
  format: string;
  diagnosis: Diagnosis | null;
  title: string | null;
  bodyMarkdown: string | null;
  brief: Brief | null;
  updatedAt: string | null;
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

      {/* Working states */}
      {WORKING.has(s.status) && (
        <div className="card--lg card mt-6">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-strong" />
            <span className="text-h5 text-ink-green">
              {s.status === "diagnosing" ? "Reading your source and diagnosing…" : "Writing your draft…"}
            </span>
          </div>
          <p className="mt-2 text-body-sm text-muted">
            {s.status === "diagnosing"
              ? "Wire is deciding what this should become before it writes — format, angle, and the keyword to target from your live intelligence."
              : "Generating on-brand, SEO- and AEO-optimized copy, then running the terminology lint pass."}
          </p>
        </div>
      )}

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
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
          <article>
            <h1 className="text-h3 text-ink-green">{s.title}</h1>
            <div className="mt-5 whitespace-pre-wrap text-body leading-relaxed text-ink">{s.bodyMarkdown}</div>

            <div className="mt-8 border-t border-line pt-6">
              <h3 className="text-h5 text-ink-green">Not quite right?</h3>
              <textarea
                className="input mt-3"
                rows={3}
                placeholder="Tell Wire what to change — 'tighten the intro', 'more concrete examples', 'warmer tone'…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn-primary mt-3" disabled={pending || !note.trim()} onClick={rerun}>
                Regenerate with this note
              </button>
              <span className="ml-3 text-micro text-muted">2 credits</span>
            </div>
          </article>

          {s.brief && <BriefPanel brief={s.brief} />}
        </div>
        <ExportPanel documentId={documentId} initialExports={initialExports} />
        </>
      )}
    </main>
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
