"use client";

import { Field } from "@/components/fields/Field";
import { ChipInput } from "@/components/fields/ChipInput";
import { PairList } from "@/components/fields/PairList";
import { ETHICS_OPTIONS } from "@/lib/wizard-steps";
import type { StepProps } from "./_types";

/** Step 4 (skippable) — Values, approved facts, ethics rules. */
export function ValuesStep({ draft, patch, aiDrafted }: StepProps) {
  const customEthics = draft.ethicsRules.filter((r) => !ETHICS_OPTIONS.includes(r));
  const toggleEthic = (opt: string) =>
    patch({
      ethicsRules: draft.ethicsRules.includes(opt)
        ? draft.ethicsRules.filter((r) => r !== opt)
        : [...draft.ethicsRules, opt],
    });

  return (
    <div className="grid gap-6">
      <Field label="Brand values" hint="3–5. Every piece must reflect at least two; the brief panel reports which." aiDraft={aiDrafted}>
        <PairList
          value={draft.values}
          onChange={(values) => patch({ values })}
          keyA="name"
          keyB="description"
          placeholderA="Honest"
          placeholderB="We never overstate what the product does"
          addLabel="Add a value"
          max={6}
        />
      </Field>

      <Field label="Approved facts" hint="Topic + claim. The only claims the writer may state as fact about you." aiDraft={aiDrafted}>
        <PairList
          value={draft.approvedFacts}
          onChange={(approvedFacts) => patch({ approvedFacts })}
          keyA="topic"
          keyB="fact"
          placeholderA="Founded"
          placeholderB="Founded in 2021 in Berlin"
          addLabel="Add a fact"
          long
        />
      </Field>

      <Field label="Ethics rules" hint="Defaults are checked; add your own.">
        <div className="grid gap-2">
          {ETHICS_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" checked={draft.ethicsRules.includes(opt)} onChange={() => toggleEthic(opt)} />
              {opt}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <ChipInput
            value={customEthics}
            onChange={(customs) =>
              patch({ ethicsRules: [...draft.ethicsRules.filter((r) => ETHICS_OPTIONS.includes(r)), ...customs] })
            }
            placeholder="Add a rule…"
          />
        </div>
      </Field>
    </div>
  );
}
