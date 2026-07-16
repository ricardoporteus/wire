"use client";

import { ChipInput } from "./ChipInput";

/**
 * The mandatory use-this / never-these table. Enforced twice downstream — in the
 * generation prompt and in the post-generation lint pass — so it earns its own
 * editor: one approved term, and the words that must never stand in for it.
 */
export function TerminologyTable({
  value, onChange,
}: {
  value: { use: string; never: string[] }[];
  onChange: (next: { use: string; never: string[] }[]) => void;
}) {
  const set = (i: number, patch: Partial<{ use: string; never: string[] }>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[1fr_1.4fr_auto] gap-3 text-micro font-medium text-muted">
        <span>Use this</span>
        <span>Never these</span>
        <span />
      </div>
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] items-start gap-3">
          <input
            className="input"
            placeholder="Education Centre"
            value={row.use}
            onChange={(e) => set(i, { use: e.target.value })}
          />
          <ChipInput
            value={row.never}
            onChange={(never) => set(i, { never })}
            placeholder="school, classroom…"
          />
          <button
            type="button"
            aria-label="Remove row"
            className="pt-3 text-muted hover:text-negative"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost w-fit"
        onClick={() => onChange([...value, { use: "", never: [] }])}
      >
        Add a term
      </button>
    </div>
  );
}
