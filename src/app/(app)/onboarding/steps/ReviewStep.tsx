"use client";

import type { WizardDraft } from "@/lib/wizard-steps";

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-t border-line py-3 first:border-t-0">
      <span className="text-caption font-medium text-muted">{label}</span>
      <span className="text-body-sm text-ink">{children}</span>
    </div>
  );
}

/** Review — the one-page "here's how Wire will write for you" summary. */
export function ReviewStep({ draft, onEdit }: { draft: WizardDraft; onEdit: (stepIndex: number) => void }) {
  const edit = (i: number) => (
    <button type="button" className="ml-2 text-micro text-accent-strong underline" onClick={() => onEdit(i)}>
      edit
    </button>
  );

  return (
    <div className="grid gap-6">
      <div>
        <span className="eyebrow">Review</span>
        <h2 className="mt-3 text-h3 text-ink-green">Here&apos;s how Wire will write for {draft.name || "you"}</h2>
        <p className="mt-2 text-muted">
          Approve to grant your trial credits and fire your first intelligence run on {draft.siteUrl || "your domain"}.
        </p>
      </div>

      <div className="card--lg card">
        <Row label={<>Company {edit(1)}</>}>{draft.whatTheyDo || "—"}</Row>
        <Row label="Differentiator">{draft.differentiator || "—"}</Row>
        <Row label={<>Who {edit(1)}</>}>{draft.icp.who || "—"}</Row>
        <Row label="Pain points">{draft.icp.painPoints.join(" · ") || "—"}</Row>
        <Row label={<>Competitors {edit(2)}</>}>
          {draft.competitors.length ? draft.competitors.map((c) => c.name || c.url).join(", ") : "—"}
        </Row>
        <Row label={<>Voice {edit(3)}</>}>{draft.voice.pillars.map((p) => p.name).join(" · ") || "—"}</Row>
        <Row label="Personality">
          {draft.voice.personality
            .map((p) => `${p.is} not ${p.notBut.replace(/^not\s+/i, "")}`)
            .join("; ") || "—"}
        </Row>
        <Row label="Terminology">
          {draft.vocabulary.terminology.length
            ? draft.vocabulary.terminology.map((t) => t.use).join(", ")
            : "—"}
        </Row>
        <Row label={<>Values {edit(4)}</>}>{draft.values.map((v) => v.name).join(" · ") || "—"}</Row>
        <Row label={<>Formats {edit(5)}</>}>
          {draft.formats.map((f) => f.format.replaceAll("_", " ")).join(", ") || "—"}
        </Row>
      </div>
    </div>
  );
}
