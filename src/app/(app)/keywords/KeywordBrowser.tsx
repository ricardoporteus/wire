"use client";

/**
 * The full keyword browser — intent filter, priority filter, search and
 * pagination over every phrase found across all runs. Chrome-free so it can be
 * embedded (it lives under "Keywords from this run" on the Research page).
 */
import { useMemo, useState } from "react";
import { INTENTS, INTENT_LABEL, PRIORITY_BADGE, formatDateTime, formatDifficulty, formatVolume } from "@/lib/seo-labels";
import { usePaging, PagerBar } from "@/components/Pager";

export type Keyword = {
  id: string;
  phrase: string;
  intent: string;
  difficulty: string | null;
  kd: number | null;
  searchVolume: number | null;
  variants: string[];
  priority: number;
  rationale: string | null;
  aeoFormat: string | null;
  active: boolean;
  createdAt: string;
};

const PRIORITIES = [
  { key: "all", label: "All priorities" },
  { key: "1", label: "P1 only" },
  { key: "2", label: "P2 only" },
  { key: "3", label: "P3 only" },
];

export function KeywordBrowser({ keywords }: { keywords: Keyword[] }) {
  const [intent, setIntent] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: keywords.length };
    for (const k of keywords) c[k.intent] = (c[k.intent] ?? 0) + 1;
    return c;
  }, [keywords]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keywords.filter((k) => {
      if (intent !== "all" && k.intent !== intent) return false;
      if (priority !== "all" && String(k.priority) !== priority) return false;
      if (q && !k.phrase.toLowerCase().includes(q) && !k.variants.some((v) => v.includes(q)) && !(k.rationale ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [keywords, intent, priority, query]);

  const { page, setPage, pageSize, setPageSize, pageCount, from, to } = usePaging(shown.length, `${intent}|${priority}|${query}`);
  const pageRows = shown.slice(from, to);

  if (keywords.length === 0) {
    return <p className="text-body-sm text-muted">No keywords yet. They appear here after your first intelligence run finishes.</p>;
  }

  return (
    <>
      {/* ---- Filters ------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Filter by intent" className="flex flex-wrap gap-1">
          <button role="tab" aria-selected={intent === "all"} onClick={() => setIntent("all")} className="tab">
            All <span className="text-muted">{counts.all}</span>
          </button>
          {INTENTS.map((it) => (
            <button key={it.key} role="tab" aria-selected={intent === it.key} onClick={() => setIntent(it.key)} className="tab">
              {it.label} <span className="text-muted">{counts[it.key] ?? 0}</span>
            </button>
          ))}
        </div>

        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority" className="input w-auto">
          {PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phrase or reasoning"
          aria-label="Search keywords"
          className="input w-auto min-w-[240px] flex-1"
        />
      </div>

      <p className="mt-3 text-caption text-muted">Showing {shown.length} of {keywords.length}</p>

      {/* ---- Table --------------------------------------------------- */}
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] text-body-sm">
          <thead>
            <tr className="border-b border-line text-caption uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 text-left font-medium">Phrase</th>
              <th className="py-2 pr-4 text-left font-medium">Intent</th>
              <th className="py-2 pr-4 text-left font-medium">Priority</th>
              <th className="py-2 pr-4 text-left font-medium">Volume</th>
              <th className="py-2 pr-4 text-left font-medium">Difficulty</th>
              <th className="py-2 pr-4 text-left font-medium">Snippet</th>
              <th className="py-2 pr-4 text-left font-medium">Why it matters</th>
              <th className="py-2 text-left font-medium">First seen</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((k) => (
              <tr key={k.id} className={`border-b border-line align-top ${k.active ? "" : "opacity-55"}`}>
                <td className="py-2.5 pr-4 font-medium text-ink-green">
                  {k.phrase}
                  {!k.active && <span className="ml-2 badge badge--draft">inactive</span>}
                  {k.variants.length > 0 && (
                    <span className="mt-0.5 block text-caption font-normal text-muted">also: {k.variants.join(", ")}</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-muted">{INTENT_LABEL[k.intent] ?? k.intent}</td>
                <td className="py-2.5 pr-4"><span className={`badge ${PRIORITY_BADGE(k.priority)}`}>P{k.priority}</span></td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-muted">{formatVolume(k.searchVolume)}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-muted">{formatDifficulty(k.kd, k.difficulty) ?? "—"}</td>
                <td className="py-2.5 pr-4 text-muted">{k.aeoFormat ?? "—"}</td>
                <td className="py-2.5 pr-4 text-muted">{k.rationale ?? "—"}</td>
                <td className="py-2.5 whitespace-nowrap text-muted">{formatDateTime(k.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {shown.length === 0 && (
          <p className="py-6 text-center text-body-sm text-muted">No keywords match those filters.</p>
        )}
      </div>

      <PagerBar page={page} count={pageCount} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} />
    </>
  );
}
