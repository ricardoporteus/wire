"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createRepurposePack, getExports } from "../actions";
import { UpgradeNotice } from "@/components/UpgradeNotice";

type Export = { id: string; kind: string; content: string };

const REPURPOSE_KINDS = [
  { key: "linkedin_article", label: "LinkedIn article" },
  { key: "linkedin_post", label: "LinkedIn post" },
  { key: "x_caption", label: "X post" },
  { key: "instagram_caption", label: "Instagram caption" },
  { key: "facebook_caption", label: "Facebook caption" },
  { key: "newsletter_block", label: "Newsletter block" },
];
const LABEL: Record<string, string> = Object.fromEntries(REPURPOSE_KINDS.map((k) => [k.key, k.label]));

const DOWNLOADS = [
  { format: "markdown", label: "Markdown" },
  { format: "html", label: "HTML" },
  { format: "docx", label: "Word (.docx)" },
];

export function ExportPanel({ documentId, initialExports }: { documentId: string; initialExports: Export[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["linkedin_article", "linkedin_post"]));
  const [rows, setRows] = useState<Export[]>(initialExports);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [, start] = useTransition();
  const target = useRef(0);

  const toggle = (k: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const create = () =>
    start(async () => {
      setError(null);
      const kinds = [...selected];
      const res = await createRepurposePack(documentId, kinds);
      if (!res.ok) { setError(res.error); return; }
      target.current = rows.length + kinds.length;
      setBuilding(true);
    });

  // Poll for the pack's export rows to land.
  useEffect(() => {
    if (!building) return;
    let ticks = 0;
    const t = setInterval(async () => {
      ticks++;
      const next = await getExports(documentId);
      setRows(next);
      if (next.length >= target.current || ticks > 20) setBuilding(false);
    }, 3000);
    return () => clearInterval(t);
  }, [building, documentId]);

  const copy = (e: Export) => {
    navigator.clipboard?.writeText(e.content);
    setCopied(e.id);
    setTimeout(() => setCopied((c) => (c === e.id ? null : c)), 1500);
  };

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-h4 text-ink-green">Export & repurpose</h2>

      {/* Deterministic downloads — free */}
      <div className="mt-4">
        <p className="text-caption text-muted">Download the piece — free.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DOWNLOADS.map((d) => (
            <a key={d.format} className="btn-ghost" href={`/write/${documentId}/export?format=${d.format}`}>
              {d.label}
            </a>
          ))}
        </div>
      </div>

      {/* Repurpose pack — 5 credits */}
      <div className="mt-6">
        <p className="text-caption text-muted">Repurpose to channel formats — one pack, 5 credits.</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {REPURPOSE_KINDS.map((k) => (
            <label key={k.key} className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" checked={selected.has(k.key)} onChange={() => toggle(k.key)} />
              {k.label}
            </label>
          ))}
        </div>
        {error === "insufficient_credits"
          ? <UpgradeNotice className="mt-2" />
          : error && <p className="mt-2 text-body-sm text-negative">{error}</p>}
        <button className="btn-accent mt-4" disabled={building || selected.size === 0} onClick={create}>
          {building ? "Building your pack…" : `Create pack (${selected.size})`}
        </button>
      </div>

      {/* Results */}
      {rows.length > 0 && (
        <div className="mt-8 grid gap-3">
          {rows.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-center justify-between">
                <span className="badge badge--opportunity">{LABEL[e.kind] ?? e.kind.replaceAll("_", " ")}</span>
                <button className="text-micro text-accent-strong underline" onClick={() => copy(e)}>
                  {copied === e.id ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-body-sm text-ink">{e.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
