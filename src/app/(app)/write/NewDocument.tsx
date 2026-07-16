"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFromPaste, createFromUrl } from "./actions";
import { UpgradeNotice } from "@/components/UpgradeNotice";

const TABS = [
  { key: "paste", label: "Paste text", enabled: true },
  { key: "url", label: "Web URL", enabled: true },
  { key: "upload", label: "Upload file", enabled: false },
  { key: "audio", label: "Audio / video link", enabled: false },
] as const;

export function NewDocument() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const go = () =>
    start(async () => {
      setError(null);
      const res = tab === "url" ? await createFromUrl(url) : await createFromPaste(text);
      if (res.ok) router.push(`/write/${res.documentId}`);
      else setError(res.error);
    });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className="tab"
            disabled={!t.enabled}
            title={t.enabled ? undefined : "Coming soon"}
            onClick={() => t.enabled && setTab(t.key)}
          >
            {t.label}{!t.enabled && <span className="ml-1 text-micro text-muted">soon</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "paste" && (
          <textarea
            className="input min-h-[220px] font-body"
            placeholder="Paste a transcript, notes, a rough draft, a voice-note dump — anything. Wire finds the piece inside it."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
        {tab === "url" && (
          <input
            className="input"
            placeholder="https://example.com/article-to-repurpose"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
          />
        )}
      </div>

      {error === "insufficient_credits"
        ? <UpgradeNotice className="mt-3" />
        : error && <p className="mt-3 text-body-sm text-negative">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button className="btn-accent" disabled={pending} onClick={go}>
          {pending ? "Diagnosing…" : "Diagnose & write"}
        </button>
        <span className="text-micro text-muted">Diagnosis costs 1 credit · generation 20.</span>
      </div>
    </div>
  );
}
