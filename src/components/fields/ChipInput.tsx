"use client";

import { useState } from "react";

/** Edit an array of short strings as removable pills. Enter or comma commits. */
export function ChipInput({
  value, onChange, placeholder = "Type and press Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [entry, setEntry] = useState("");

  const commit = () => {
    const v = entry.trim().replace(/,$/, "");
    if (v && !value.includes(v)) onChange([...value, v]);
    setEntry("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-card p-2">
      {value.map((chip, i) => (
        <span key={`${chip}-${i}`} className="badge badge--draft">
          {chip}
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            className="ml-1 text-muted hover:text-negative"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-body-sm outline-none"
        value={entry}
        placeholder={placeholder}
        onChange={(e) => setEntry(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !entry && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
