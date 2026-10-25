"use client";

/**
 * Tabbed keyword view for Research: High intent / Informational / Long-tail,
 * plus a dedicated Answer-engine (AEO) tab that leads with the winning snippet
 * format — the thing that makes Mavrix an AEO product, not a footnote in a table.
 */
import { useState } from "react";
import { INTENT_LABEL, PRIORITY_BADGE, formatVolume, formatDifficulty } from "@/lib/seo-labels";

export type Kw = {
  id: string; phrase: string; intent: string; priority: number;
  difficulty: string | null; kd: number | null; searchVolume: number | null;
  aeoFormat: string | null; rationale: string | null; recommendedFormat: string | null;
  variants: string[] | null;
};

const INTENTS = [
  { key: "high_intent", label: "High intent" },
  { key: "informational", label: "Informational" },
  { key: "long_tail", label: "Long-tail" },
  { key: "aeo_question", label: "Answer-engine" },
] as const;

const TIPS = {
  phrase: "The exact search phrase or question your audience types — a keyword phrase (e.g. “AI content marketing tool”) or an answer-engine question the research found them asking. Each becomes a target for a piece of content.",
  intent: "What the searcher is trying to do. High intent = ready to act (commercial); Informational = still researching; Long-tail = specific, lower-volume phrases; Answer-engine = something people ask AI and search engines. Intent shapes the format and angle of the piece Mavrix writes.",
  priority: "How urgently to target this, from P1 to P3. P1 is red-hot — high value and winnable now, so write these first. Priority ranks each keyword's opportunity: how well it fits your buyer, search volume, difficulty, intent, and what Google's results page looks like.",
  volume: "How many times a month people search this exact phrase on Google in your main market, from measured search data. Close variants (listed under the phrase) are targeted by the same piece.",
  difficulty: "How hard it is to reach Google's first page, on a 0–100 scale measured from the strength of the pages already ranking: under 30 is low, 30–59 medium, 60+ high. Older keywords found before measurement show an estimate marked 'est.'.",
  why: "Why this phrase is worth your time: the opportunity or angle the research found.",
} as const;

function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold normal-case leading-none text-muted transition-colors hover:border-ink-green hover:text-ink-green focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-[calc(100%_+_6px)] z-20 w-64 whitespace-normal rounded-md border border-line bg-card p-3 text-left text-caption font-normal normal-case leading-relaxed tracking-normal text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${align === "right" ? "right-0" : "left-0"}`}
      >
        {text}
      </span>
    </span>
  );
}

function whyItMatters(k: Kw): string {
  if (k.rationale) return k.rationale;
  if (k.intent === "aeo_question") {
    return k.aeoFormat
      ? `Featured-snippet target — win it with a ${k.aeoFormat}.`
      : "Answer-engine target — write a direct, structured answer to win the AI/snippet result.";
  }
  return "—";
}

export function ResearchKeywords({ keywords }: { keywords: Kw[] }) {
  const available = INTENTS.filter((it) => keywords.some((k) => k.intent === it.key));
  const [tab, setTab] = useState<string>(available[0]?.key ?? "high_intent");
  const rows = keywords.filter((k) => k.intent === tab);

  if (keywords.length === 0) {
    return <p className="text-body-sm text-muted">No keywords were saved for this run.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1" role="tablist">
        {available.map((it) => {
          const n = keywords.filter((k) => k.intent === it.key).length;
          return (
            <button
              key={it.key}
              role="tab"
              aria-selected={tab === it.key}
              className="tab"
              onClick={() => setTab(it.key)}
            >
              {it.label} <span className="text-muted">({n})</span>
            </button>
          );
        })}
      </div>

      {tab === "aeo_question" ? (
        <AeoView rows={rows} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-body-sm">
            <thead>
              <tr className="border-b border-line text-caption uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Phrase<InfoTip text={TIPS.phrase} /></th>
                <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Intent<InfoTip text={TIPS.intent} /></th>
                <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Priority<InfoTip text={TIPS.priority} /></th>
                <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Volume<InfoTip text={TIPS.volume} /></th>
                <th className="whitespace-nowrap py-2 pr-4 text-left font-medium">Difficulty<InfoTip text={TIPS.difficulty} /></th>
                <th className="whitespace-nowrap py-2 text-left font-medium">Why it matters<InfoTip text={TIPS.why} align="right" /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} className="border-b border-line align-top">
                  <td className="py-2.5 pr-4 font-medium text-ink-green">
                    {k.phrase}
                    {k.variants && k.variants.length > 0 && (
                      <span className="mt-0.5 block text-caption font-normal text-muted">also: {k.variants.join(", ")}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-muted">{INTENT_LABEL[k.intent] ?? k.intent}</td>
                  <td className="py-2.5 pr-4"><span className={`badge ${PRIORITY_BADGE(k.priority)}`}>P{k.priority}</span></td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-muted">{formatVolume(k.searchVolume)}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-muted">{formatDifficulty(k.kd, k.difficulty) ?? "—"}</td>
                  <td className="py-2.5 text-muted">
                    {whyItMatters(k)}
                    {k.recommendedFormat && (
                      <span className="mt-0.5 block text-caption">Write it as: {k.recommendedFormat.replace(/_/g, " ")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** The AEO tab — questions grouped by the format that wins their answer box. */
function AeoView({ rows }: { rows: Kw[] }) {
  const FORMAT_LABEL: Record<string, string> = {
    paragraph: "Win with a paragraph", list: "Win with a list", table: "Win with a table",
  };
  return (
    <>
      <p className="mb-4 text-body-sm text-muted">
        Questions your audience asks AI and search engines where no page owns the answer yet. Answer each in the format that wins the box, and you get cited.
      </p>
      <div className="grid gap-3">
        {rows.map((k) => (
          <div key={k.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${PRIORITY_BADGE(k.priority)}`}>P{k.priority}</span>
              {k.aeoFormat && <span className="badge badge--opportunity">{FORMAT_LABEL[k.aeoFormat] ?? `Win with a ${k.aeoFormat}`}</span>}
              <h4 className="text-h5 text-ink-green">{k.phrase}</h4>
            </div>
            <p className="mt-2 text-caption text-muted">{whyItMatters(k)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
