"use client";

import { DEFAULT_FORMATS } from "@/lib/wizard-steps";
import type { StepProps } from "./_types";

const LABELS: Record<string, string> = {
  article: "Article",
  listicle: "Listicle",
  how_to: "How-to",
  lesson: "Lesson",
  tutorial: "Tutorial",
  testimonial: "Testimonial",
  faq_page: "FAQ page",
};

/** Step 5 (skippable) — toggle formats and tune their length rules. */
export function FormatsStep({ draft, patch }: StepProps) {
  const enabled = draft.formats;
  const byFormat = (f: string) => enabled.find((e) => e.format === f);

  const toggle = (format: string) => {
    if (byFormat(format)) {
      patch({ formats: enabled.filter((e) => e.format !== format) });
    } else {
      const seed = DEFAULT_FORMATS.find((d) => d.format === format)!;
      patch({ formats: [...enabled, { ...seed }] });
    }
  };

  const setField = (format: string, p: Partial<(typeof enabled)[number]>) =>
    patch({ formats: enabled.map((e) => (e.format === format ? { ...e, ...p } : e)) });

  return (
    <div className="grid gap-3">
      <p className="text-body-sm text-muted">
        All seven are on by default with proven length rules. Turn off what you'll never publish; edit the rest.
      </p>
      {DEFAULT_FORMATS.map((d) => {
        const on = byFormat(d.format);
        return (
          <div key={d.format} className={`card ${on ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={!!on} onChange={() => toggle(d.format)} />
                <span className="text-h5 text-ink-green">{LABELS[d.format] ?? d.format}</span>
              </label>
              {on && (
                <div className="flex items-center gap-2 text-caption text-muted">
                  <input
                    className="input w-20"
                    type="number"
                    value={on.minWords}
                    onChange={(e) => setField(d.format, { minWords: Number(e.target.value) })}
                  />
                  <span>–</span>
                  <input
                    className="input w-20"
                    type="number"
                    value={on.maxWords}
                    onChange={(e) => setField(d.format, { maxWords: Number(e.target.value) })}
                  />
                  <span>words</span>
                </div>
              )}
            </div>
            {on && (
              <textarea
                className="input mt-3"
                rows={2}
                value={on.structureNotes}
                onChange={(e) => setField(d.format, { structureNotes: e.target.value })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
