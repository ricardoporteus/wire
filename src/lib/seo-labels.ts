/**
 * Display vocabulary for keywords and intelligence runs.
 *
 * Pure constants and formatters, no imports, so client components can use them
 * without dragging anything else into the browser bundle. The dashboard, the
 * audit page and the keywords page all read from here so the same run can never
 * be described three different ways.
 */

export const INTENTS = [
  { key: "high_intent", label: "High intent" },
  { key: "informational", label: "Informational" },
  { key: "long_tail", label: "Long-tail" },
  { key: "aeo_question", label: "AEO questions" },
] as const;

export const INTENT_LABEL: Record<string, string> =
  Object.fromEntries(INTENTS.map((i) => [i.key, i.label]));

/** P1 is red-hot, P3 is background. Matches the priority scale the pipeline writes. */
export const PRIORITY_BADGE = (p: number) =>
  p <= 1 ? "badge--attention" : p === 2 ? "badge--opportunity" : "badge--draft";

export const RUNNING_STATUSES = new Set([
  "queued", "researching_keywords", "analyzing_competitors",
  "finding_gaps", "finding_aeo", "compiling",
]);

export const RUN_STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  researching_keywords: "Researching keywords",
  analyzing_competitors: "Analysing competitors",
  finding_gaps: "Finding content gaps",
  finding_aeo: "Finding AEO questions",
  compiling: "Compiling",
  complete: "Complete",
  failed: "Failed",
};

export const RUN_STATUS_BADGE = (s: string) =>
  s === "complete" ? "badge--published"
  : s === "failed" ? "badge--attention"
  : "badge--queued";

export const TRIGGER_LABEL: Record<string, string> = {
  onboarding: "First run",
  scheduled: "Scheduled",
  on_demand: "On demand",
};

/** "3 Jul 2026, 06:12" — stable across server and client, unlike toLocaleString defaults. */
export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(date);
}

/** Run duration in human terms, or a dash while it is still going. */
export function formatDuration(start: Date | string | null, end: Date | string | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** "12,100/mo", or a dash for phrases with no measured volume. */
export function formatVolume(n: number | null | undefined) {
  return n == null ? "—" : `${n.toLocaleString("en-US")}/mo`;
}

/**
 * Measured difficulty reads "12 · low" (DataForSEO KD 0–100, with its band).
 * Rows from before measurement, or from a model-only fallback run, only have
 * the model's label, marked "est." so nobody mistakes a guess for a measurement.
 */
export function formatDifficulty(kd: number | null | undefined, label: string | null | undefined) {
  if (kd != null) return `${kd} · ${label ?? (kd < 30 ? "low" : kd < 60 ? "medium" : "high")}`;
  return label ? `${label} (est.)` : null;
}
