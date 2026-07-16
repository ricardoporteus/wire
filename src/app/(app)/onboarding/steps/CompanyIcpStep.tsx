"use client";

import { Field } from "@/components/fields/Field";
import { ChipInput } from "@/components/fields/ChipInput";
import type { StepProps } from "./_types";

/** Step 1 — Company & ICP. Mandatory: who + ≥2 pain points + search behaviour. */
export function CompanyIcpStep({ draft, patch, aiDrafted }: StepProps) {
  const icp = draft.icp;
  const setIcp = (p: Partial<typeof icp>) => patch({ icp: { ...icp, ...p } });

  return (
    <div className="grid gap-5">
      <Field label="What the company does" hint="Two or three plain sentences." aiDraft={aiDrafted}>
        <textarea
          className="input"
          rows={3}
          value={draft.whatTheyDo}
          onChange={(e) => patch({ whatTheyDo: e.target.value })}
          placeholder="Acme helps…"
        />
      </Field>

      <Field label="Differentiator" hint="One sentence — what makes you different." aiDraft={aiDrafted}>
        <input
          className="input"
          value={draft.differentiator}
          onChange={(e) => patch({ differentiator: e.target.value })}
          placeholder="The only… / Unlike…"
        />
      </Field>

      <div className="mt-2 border-t border-line pt-5">
        <span className="eyebrow eyebrow--cream">Who you write for</span>
      </div>

      <Field label="Who they are" hint="One line: role, stage, context." aiDraft={aiDrafted}>
        <input
          className="input"
          value={icp.who}
          onChange={(e) => setIcp({ who: e.target.value })}
          placeholder="Heads of marketing at Series A/B B2B SaaS, 30–45"
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Segments" hint="Profile types." aiDraft={aiDrafted}>
          <ChipInput value={icp.segments} onChange={(segments) => setIcp({ segments })} placeholder="Founder-led, PLG…" />
        </Field>
        <Field label="Geographies" hint="Where your customers are." aiDraft={aiDrafted}>
          <ChipInput value={icp.geographies} onChange={(geographies) => setIcp({ geographies })} placeholder="US, UK, EU…" />
        </Field>
      </div>

      <Field label="Pain points" hint="3–6, phrased as the customer feels them (min 2)." aiDraft={aiDrafted}>
        <ChipInput value={icp.painPoints} onChange={(painPoints) => setIcp({ painPoints })} placeholder="Content that sounds like everyone else…" />
      </Field>

      <Field label="Search behaviour" hint="How they phrase searches — problems and aspirations, not brand names." aiDraft={aiDrafted}>
        <textarea
          className="input"
          rows={3}
          value={icp.searchBehaviour}
          onChange={(e) => setIcp({ searchBehaviour: e.target.value })}
          placeholder="They Google problems like 'how to…' and aspirations like 'best way to…'"
        />
      </Field>

      <Field label="Emotional journey" hint="Optional — fears and desires that shape the angle." aiDraft={aiDrafted}>
        <textarea
          className="input"
          rows={2}
          value={icp.emotionalJourney ?? ""}
          onChange={(e) => setIcp({ emotionalJourney: e.target.value })}
        />
      </Field>
    </div>
  );
}
