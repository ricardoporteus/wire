"use client";

import { useState, useTransition } from "react";
import { OrganizationProfile } from "@clerk/nextjs";
import { savePartial } from "../onboarding/actions";
import { CompanyIcpStep } from "../onboarding/steps/CompanyIcpStep";
import { CompetitorsStep } from "../onboarding/steps/CompetitorsStep";
import { VoiceStep } from "../onboarding/steps/VoiceStep";
import { ValuesStep } from "../onboarding/steps/ValuesStep";
import { FormatsStep } from "../onboarding/steps/FormatsStep";
import type { WizardDraft } from "@/lib/wizard-steps";

const SECTIONS = [
  { title: "Company & ICP", Step: CompanyIcpStep },
  { title: "Competitors", Step: CompetitorsStep },
  { title: "Voice & vocabulary", Step: VoiceStep },
  { title: "Values & facts", Step: ValuesStep },
  { title: "Formats", Step: FormatsStep },
] as const;

export function SettingsClient({
  brainId, brainName, initialDraft,
}: {
  brainId: string;
  brainName: string;
  initialDraft: WizardDraft;
}) {
  const [tab, setTab] = useState<"brain" | "team">("brain");
  const [draft, setDraft] = useState<WizardDraft>(initialDraft);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const patch = (p: Partial<WizardDraft>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  const save = () =>
    start(async () => {
      await savePartial(brainId, {
        whatTheyDo: draft.whatTheyDo,
        differentiator: draft.differentiator || undefined,
        icp: draft.icp,
        competitors: draft.competitors,
        voice: draft.voice,
        vocabulary: draft.vocabulary,
        values: draft.values,
        approvedFacts: draft.approvedFacts,
        ethicsRules: draft.ethicsRules,
        formats: draft.formats,
      });
      setSaved(true);
    });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">{brainName}</span>
      <h1 className="mt-4 text-h2 text-ink-green">Settings</h1>

      <div className="mt-6 flex gap-1" role="tablist">
        <button role="tab" aria-selected={tab === "brain"} className="tab" onClick={() => setTab("brain")}>Brand Brain</button>
        <button role="tab" aria-selected={tab === "team"} className="tab" onClick={() => setTab("team")}>Team</button>
      </div>

      {tab === "brain" && (
        <div className="mt-8 grid gap-12 pb-24">
          <p className="text-body-sm text-muted">
            This is what both agents read at runtime. Edits apply to the next intelligence run and every new piece.
          </p>
          {SECTIONS.map(({ title, Step }) => (
            <section key={title}>
              <h2 className="mb-4 text-h4 text-ink-green">{title}</h2>
              <Step draft={draft} patch={patch} />
            </section>
          ))}
          <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
              <button className="btn-accent" disabled={pending} onClick={save}>
                {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
              </button>
              <span className="text-micro text-muted">The Boundless skills prove this schema — every field is per-brand config.</span>
            </div>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="mt-8">
          <OrganizationProfile routing="hash" />
        </div>
      )}
    </main>
  );
}
