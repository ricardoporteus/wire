"use client";

/**
 * A list of two-field rows — reused for voice pillars (name / description),
 * brand values (name / description), and approved facts (topic / fact).
 * `keyA`/`keyB` name the two string fields; `long` makes the second a textarea.
 */
export function PairList<T extends Record<string, string>>({
  value, onChange, keyA, keyB, placeholderA, placeholderB, addLabel, long = false, max,
}: {
  value: T[];
  onChange: (next: T[]) => void;
  keyA: keyof T & string;
  keyB: keyof T & string;
  placeholderA: string;
  placeholderB: string;
  addLabel: string;
  long?: boolean;
  max?: number;
}) {
  const set = (i: number, patch: Partial<T>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const blank = { [keyA]: "", [keyB]: "" } as T;

  return (
    <div className="grid gap-3">
      {value.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            className="input w-1/3"
            placeholder={placeholderA}
            value={row[keyA]}
            onChange={(e) => set(i, { [keyA]: e.target.value } as Partial<T>)}
          />
          {long ? (
            <textarea
              className="input flex-1"
              rows={2}
              placeholder={placeholderB}
              value={row[keyB]}
              onChange={(e) => set(i, { [keyB]: e.target.value } as Partial<T>)}
            />
          ) : (
            <input
              className="input flex-1"
              placeholder={placeholderB}
              value={row[keyB]}
              onChange={(e) => set(i, { [keyB]: e.target.value } as Partial<T>)}
            />
          )}
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
      {(max === undefined || value.length < max) && (
        <button
          type="button"
          className="btn-ghost w-fit"
          onClick={() => onChange([...value, blank])}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
