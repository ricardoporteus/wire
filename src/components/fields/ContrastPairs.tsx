"use client";

/** Edit "is X but not Y" personality contrast pairs (min 3 enforced on Next). */
export function ContrastPairs({
  value, onChange,
}: {
  value: { is: string; notBut: string }[];
  onChange: (next: { is: string; notBut: string }[]) => void;
}) {
  const set = (i: number, patch: Partial<{ is: string; notBut: string }>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="grid gap-2">
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-caption text-muted">is</span>
          <input
            className="input flex-1"
            placeholder="confident"
            value={row.is}
            onChange={(e) => set(i, { is: e.target.value })}
          />
          <span className="text-caption text-muted">but not</span>
          <input
            className="input flex-1"
            placeholder="arrogant"
            value={row.notBut}
            onChange={(e) => set(i, { notBut: e.target.value })}
          />
          <button
            type="button"
            aria-label="Remove pair"
            className="text-muted hover:text-negative"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost w-fit"
        onClick={() => onChange([...value, { is: "", notBut: "" }])}
      >
        Add a contrast
      </button>
    </div>
  );
}
