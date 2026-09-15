"use client";

import { Field } from "@/components/fields/Field";
import type { StepProps } from "./_types";

const looksLikeUrl = (u: string) => /^https?:\/\/.+\..+/i.test(u.trim());

/** Step 2 — Competitors. 3–8 URLs that drive every intelligence run. */
export function CompetitorsStep({ draft, patch, aiDrafted }: StepProps) {
  const rows = draft.competitors;
  const set = (i: number, p: Partial<(typeof rows)[number]>) =>
    patch({ competitors: rows.map((r, j) => (j === i ? { ...r, ...p } : r)) });

  return (
    <div className="grid gap-4">
      <Field
        label="Competitors"
        hint="3–8 sites. Mavrix analyses each one's topics, keywords, and gaps every run."
        aiDraft={aiDrafted}
      >
        <div className="grid gap-3">
          {rows.map((row, i) => {
            const invalid = row.url.length > 0 && !looksLikeUrl(row.url);
            return (
              <div key={i} className="grid gap-2 rounded-md border border-line bg-card p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="https://competitor.com"
                    value={row.url}
                    onChange={(e) => set(i, { url: e.target.value })}
                  />
                  {row.url.length > 0 && (
                    <span className={`badge ${invalid ? "badge--attention" : "badge--published"}`}>
                      {invalid ? "check URL" : "ok"}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Remove competitor"
                    className="px-1 text-muted hover:text-negative"
                    onClick={() => patch({ competitors: rows.filter((_, j) => j !== i) })}
                  >
                    ×
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Name (optional)"
                    value={row.name ?? ""}
                    onChange={(e) => set(i, { name: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Note (optional) — e.g. strongest on SEO"
                    value={row.note ?? ""}
                    onChange={(e) => set(i, { note: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Field>

      {rows.length < 8 && (
        <button
          type="button"
          className="btn-ghost w-fit"
          onClick={() => patch({ competitors: [...rows, { url: "", name: "", note: "" }] })}
        >
          Add a competitor
        </button>
      )}
      <p className="text-micro text-muted">{rows.length} of 8 · need at least 3</p>
    </div>
  );
}
