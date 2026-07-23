"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFromPaste, createFromUrl, createFromMediaLink } from "./actions";
import { UpgradeNotice } from "@/components/UpgradeNotice";
import { CREDIT_COSTS } from "@/lib/credit-costs";

const TABS = [
  { key: "paste", label: "Paste text", enabled: true },
  { key: "url", label: "Web URL", enabled: true },
  { key: "audio", label: "Audio / video / podcast", enabled: true },
  { key: "upload", label: "Upload file", enabled: false },
] as const;

export function NewDocument() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [media, setMedia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const go = () =>
    start(async () => {
      setError(null);
      const res =
        tab === "url" ? await createFromUrl(url)
        : tab === "audio" ? await createFromMediaLink(media)
        : await createFromPaste(text);
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
        {tab === "audio" && (
          <>
            <input
              className="input"
              placeholder="https://…/episode.mp3, a podcast RSS link, or a YouTube URL"
              value={media}
              onChange={(e) => setMedia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
            <p className="mt-2 text-micro text-muted">
              Works with a direct audio or video file, a podcast RSS or episode link, and YouTube videos that have
              captions. We transcribe it, then diagnose and write from the transcript.
            </p>
          </>
        )}
      </div>

      {error === "insufficient_credits"
        ? <UpgradeNotice className="mt-3" />
        : error && <p className="mt-3 text-body-sm text-negative">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button className="btn-accent" disabled={pending} onClick={go}>
          {pending ? (tab === "audio" ? "Transcribing…" : "Diagnosing…") : "Diagnose & write"}
        </button>
        <span className="text-micro text-muted">
          {tab === "audio"
            ? `Transcription ${CREDIT_COSTS.transcription} credits · diagnosis 1 · generation 20.`
            : "Diagnosis costs 1 credit · generation 20."}
        </span>
      </div>
    </div>
  );
}
