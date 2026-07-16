"use client";

/** Label + optional hint + "AI draft — review me" marker + inline error. */
export function Field({
  label, hint, error, aiDraft, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  aiDraft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2">
        <span className="text-caption font-medium text-ink-green">{label}</span>
        {aiDraft && <span className="badge badge--queued">AI draft — review me</span>}
      </span>
      {hint && <span className="mt-1 block text-micro text-muted">{hint}</span>}
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1 block text-micro text-negative">{error}</span>}
    </label>
  );
}
