"use client";

import { Field } from "@/components/fields/Field";
import { ChipInput } from "@/components/fields/ChipInput";
import { ContrastPairs } from "@/components/fields/ContrastPairs";
import { TerminologyTable } from "@/components/fields/TerminologyTable";
import { PairList } from "@/components/fields/PairList";
import { COPY_PRINCIPLE_OPTIONS } from "@/lib/wizard-steps";
import type { StepProps } from "./_types";

/** Step 3 — Voice & vocabulary. Mandatory: ≥2 pillars, ≥3 contrasts, ≥3 principles. */
export function VoiceStep({ draft, patch, aiDrafted }: StepProps) {
  const voice = draft.voice;
  const vocab = draft.vocabulary;
  const setVoice = (p: Partial<typeof voice>) => patch({ voice: { ...voice, ...p } });
  const setVocab = (p: Partial<typeof vocab>) => patch({ vocabulary: { ...vocab, ...p } });

  const customPrinciples = voice.principles.filter((p) => !COPY_PRINCIPLE_OPTIONS.includes(p));
  const togglePrinciple = (opt: string) =>
    setVoice({
      principles: voice.principles.includes(opt)
        ? voice.principles.filter((p) => p !== opt)
        : [...voice.principles, opt],
    });

  return (
    <div className="grid gap-6">
      <Field label="Voice pillars" hint="2–4 — the qualities your writing leads with." aiDraft={aiDrafted}>
        <PairList
          value={voice.pillars}
          onChange={(pillars) => setVoice({ pillars })}
          keyA="name"
          keyB="description"
          placeholderA="Inspiring"
          placeholderB="Lifts the reader toward what's possible"
          addLabel="Add a pillar"
          max={4}
        />
      </Field>

      <Field label="Personality contrasts" hint='"is X but not Y" — minimum 3.' aiDraft={aiDrafted}>
        <ContrastPairs value={voice.personality} onChange={(personality) => setVoice({ personality })} />
      </Field>

      <Field label="Copy principles" hint="Defaults are checked; add your own below." aiDraft={aiDrafted}>
        <div className="grid gap-2 md:grid-cols-2">
          {COPY_PRINCIPLE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={voice.principles.includes(opt)}
                onChange={() => togglePrinciple(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <ChipInput
            value={customPrinciples}
            onChange={(customs) =>
              setVoice({ principles: [...voice.principles.filter((p) => COPY_PRINCIPLE_OPTIONS.includes(p)), ...customs] })
            }
            placeholder="Add a principle…"
          />
        </div>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Locale" hint="Drives spelling and punctuation everywhere.">
          <select className="input" value={voice.locale} onChange={(e) => setVoice({ locale: e.target.value })}>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="en-AU">English (AU)</option>
            <option value="en-CA">English (CA)</option>
          </select>
        </Field>
        <Field label="Headline style" hint="Optional — e.g. sentence case, benefit-led." aiDraft={aiDrafted}>
          <input className="input" value={voice.headlineStyle ?? ""} onChange={(e) => setVoice({ headlineStyle: e.target.value })} />
        </Field>
      </div>

      <div className="border-t border-line pt-5">
        <span className="eyebrow eyebrow--cream">Vocabulary</span>
      </div>

      <Field
        label="Terminology"
        hint="Use-this / never-these. Enforced in generation and flagged in the editor's lint pass."
        aiDraft={aiDrafted}
      >
        <TerminologyTable value={vocab.terminology} onChange={(terminology) => setVocab({ terminology })} />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Preferred verbs" aiDraft={aiDrafted}>
          <ChipInput value={vocab.preferredVerbs} onChange={(preferredVerbs) => setVocab({ preferredVerbs })} />
        </Field>
        <Field label="Preferred nouns" aiDraft={aiDrafted}>
          <ChipInput value={vocab.preferredNouns} onChange={(preferredNouns) => setVocab({ preferredNouns })} />
        </Field>
        <Field label="Preferred adjectives" aiDraft={aiDrafted}>
          <ChipInput value={vocab.preferredAdjectives} onChange={(preferredAdjectives) => setVocab({ preferredAdjectives })} />
        </Field>
      </div>

      <Field label="Banned words" hint="Never use these.">
        <ChipInput value={vocab.banned} onChange={(banned) => setVocab({ banned })} placeholder="leverage, synergy, game-changer…" />
      </Field>
    </div>
  );
}
