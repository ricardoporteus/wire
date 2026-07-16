"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STEPS, emptyDraft, type WizardDraft, type StepKey } from "@/lib/wizard-steps";
import { saveStep, savePartial, approveBrain } from "./actions";
import { SiteScanStep } from "./steps/SiteScanStep";
import { CompanyIcpStep } from "./steps/CompanyIcpStep";
import { CompetitorsStep } from "./steps/CompetitorsStep";
import { VoiceStep } from "./steps/VoiceStep";
import { ValuesStep } from "./steps/ValuesStep";
import { FormatsStep } from "./steps/FormatsStep";
import { ReviewStep } from "./steps/ReviewStep";

/** The slice of the draft each step owns, keyed to its DB columns. */
function sliceFor(index: number, d: WizardDraft): Record<string, unknown> {
  switch (STEPS[index].key) {
    case "company": return { whatTheyDo: d.whatTheyDo, differentiator: d.differentiator || undefined, icp: d.icp };
    case "competitors": return { competitors: d.competitors };
    case "voice": return { voice: d.voice, vocabulary: d.vocabulary };
    case "values": return { values: d.values, approvedFacts: d.approvedFacts, ethicsRules: d.ethicsRules };
    case "formats": return { formats: d.formats };
    default: return {};
  }
}

function firstError(error: { formErrors: string[]; fieldErrors: Record<string, unknown> }): string {
  if (error.formErrors?.length) return error.formErrors[0];
  const [field, msgs] = Object.entries(error.fieldErrors)[0] ?? [];
  const msg = Array.isArray(msgs) ? msgs[0] : undefined;
  return field ? `${field}: ${msg ?? "please check this"}` : "Please complete the required fields.";
}

export function Wizard({
  initialBrainId, initialDraft, initialAiDrafted,
}: {
  initialBrainId: string | null;
  initialDraft: WizardDraft | null;
  initialAiDrafted: boolean;
}) {
  const router = useRouter();
  const [brainId, setBrainId] = useState(initialBrainId);
  const [draft, setDraft] = useState<WizardDraft>(initialDraft ?? emptyDraft());
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [aiDrafted, setAiDrafted] = useState(initialAiDrafted);
  const [step, setStep] = useState(initialBrainId ? 1 : 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const meta = STEPS[step];
  const patch = (p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p }));

  const onSiteReady = (id: string, d: WizardDraft, drafted: boolean) => {
    setBrainId(id);
    setDraft(d);
    setName(d.name);
    setAiDrafted(drafted);
    setStep(1);
  };

  const next = () => {
    setError(null);
    if (!brainId) return;
    if (meta.key === "review") return approve();
    start(async () => {
      const res = await saveStep(brainId, meta.key as StepKey, sliceFor(step, draft));
      if (res.ok) setStep(step + 1);
      else setError(firstError(res.error));
    });
  };

  const skip = () => {
    setError(null);
    if (!brainId) return;
    start(async () => {
      await savePartial(brainId, sliceFor(step, draft));
      setStep(step + 1);
    });
  };

  const approve = () => {
    if (!brainId) return;
    start(async () => {
      const res = await approveBrain(brainId);
      if (res.ok) router.push("/dashboard");
      else setError(firstError(res.error));
    });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[220px_1fr]">
      {/* Left rail — step progress */}
      <nav className="hidden md:block">
        <span className="eyebrow">Brand Brain</span>
        <ol className="mt-5 grid gap-1">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={i > step || !brainId}
                  onClick={() => brainId && i <= step && setStep(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm ${
                    state === "current" ? "bg-accent-tint font-medium text-ink-green"
                    : state === "done" ? "text-ink"
                    : "text-muted"
                  }`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-pill text-micro ${
                    state === "done" ? "bg-positive text-white"
                    : state === "current" ? "bg-accent text-ink-green"
                    : "bg-bg-alt text-muted"
                  }`}>
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  {s.title}
                  {s.optional && <span className="ml-auto text-micro text-muted">optional</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Main panel */}
      <div>
        <header className="mb-6">
          <h1 className="text-h3 text-ink-green">{meta.title}</h1>
          <p className="mt-1 text-muted">{meta.blurb}</p>
        </header>

        {meta.key === "site" && (
          <SiteScanStep name={name} setName={setName} onReady={onSiteReady} />
        )}
        {meta.key === "company" && <CompanyIcpStep draft={draft} patch={patch} aiDrafted={aiDrafted} />}
        {meta.key === "competitors" && <CompetitorsStep draft={draft} patch={patch} aiDrafted={aiDrafted} />}
        {meta.key === "voice" && <VoiceStep draft={draft} patch={patch} aiDrafted={aiDrafted} />}
        {meta.key === "values" && <ValuesStep draft={draft} patch={patch} aiDrafted={aiDrafted} />}
        {meta.key === "formats" && <FormatsStep draft={draft} patch={patch} aiDrafted={aiDrafted} />}
        {meta.key === "review" && <ReviewStep draft={draft} onEdit={(i) => setStep(i)} />}

        {error && (
          <p className="mt-5 rounded-md border border-negative/30 bg-[#FEECEC] px-4 py-3 text-body-sm text-negative">
            {error}
          </p>
        )}

        {/* Footer nav — hidden on the site step (it drives its own transitions) */}
        {meta.key !== "site" && (
          <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
            <button
              type="button"
              className="btn-ghost"
              disabled={step <= 1 || pending}
              onClick={() => { setError(null); setStep(step - 1); }}
            >
              Back
            </button>
            <div className="flex-1" />
            {meta.optional && (
              <button type="button" className="btn-ghost" disabled={pending} onClick={skip}>
                Skip
              </button>
            )}
            <button type="button" className="btn-accent" disabled={pending} onClick={next}>
              {pending ? "Saving…" : meta.key === "review" ? "Approve & start my first run" : "Save & continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
