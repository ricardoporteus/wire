"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/fields/Field";
import { startDraft, getBrainState } from "../actions";
import type { WizardDraft } from "@/lib/wizard-steps";

const PROGRESS_LINES = [
  "Reading your homepage…",
  "Studying how you talk about yourself…",
  "Drafting your ICP…",
  "Sketching your voice and vocabulary…",
  "Pulling competitors and values together…",
];

/**
 * Step 0 — "draft it for me". Collects the URL, fires the drafter job, then
 * polls until the Brain comes back drafted. Never blocks: the customer can skip
 * the wait or start blank. All three paths resolve to `onReady(brainId, draft)`.
 */
export function SiteScanStep({
  name, setName, onReady,
}: {
  name: string;
  setName: (n: string) => void;
  onReady: (brainId: string, draft: WizardDraft, aiDrafted: boolean) => void;
}) {
  const [siteUrl, setSiteUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const brainIdRef = useRef<string | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setLine((l) => (l + 1) % PROGRESS_LINES.length), 1800);
    return () => clearInterval(t);
  }, [scanning]);

  const normalizedUrl = () => {
    let url = siteUrl.trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { new URL(url); return url; } catch { return null; }
  };

  const draftIt = async () => {
    setError(null);
    const url = normalizedUrl();
    if (!url) { setError("That doesn't look like a valid URL."); return; }
    setScanning(true);
    try {
      const { brainId } = await startDraft({ name: name.trim() || new URL(url).hostname, siteUrl: url, draftIt: true });
      brainIdRef.current = brainId;
      pollRef.current = setInterval(async () => {
        const state = await getBrainState(brainId);
        if (state.aiDraftedAt) {
          if (pollRef.current) clearInterval(pollRef.current);
          onReady(brainId, state.draft, true);
        }
      }, 2500);
    } catch (e) {
      setScanning(false);
      setError(e instanceof Error ? e.message : "Couldn't start the scan.");
    }
  };

  const startBlank = async () => {
    setError(null);
    const url = normalizedUrl();
    if (!url) { setError("Add your website URL first."); return; }
    try {
      const { brainId } = await startDraft({ name: name.trim() || new URL(url).hostname, siteUrl: url, draftIt: false });
      const state = await getBrainState(brainId);
      onReady(brainId, state.draft, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the workspace.");
    }
  };

  const skipWait = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const brainId = brainIdRef.current;
    if (!brainId) return;
    const state = await getBrainState(brainId);
    onReady(brainId, state.draft, !!state.aiDraftedAt);
  };

  if (scanning) {
    return (
      <div className="grid gap-6">
        <div className="card--lg card">
          <span className="eyebrow">Drafting your Brand Brain</span>
          <p className="mt-4 text-h5 text-ink-green">{PROGRESS_LINES[line]}</p>
          <p className="mt-2 text-body-sm text-muted">
            Wire is reading your site and drafting every step. This usually takes under a minute.
          </p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-pill bg-bg-alt">
            <div className="h-full w-1/3 animate-pulse rounded-pill bg-accent-strong" />
          </div>
        </div>
        <button className="btn-ghost w-fit" onClick={skipWait}>
          Skip the wait — I&apos;ll fill it in
        </button>
      </div>
    );
  }

  return (
    <div className="grid max-w-xl gap-5">
      <Field label="Brand name" hint="How your brand is written in copy.">
        <input className="input" placeholder="Acme" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Website URL" hint="Wire reads your home, about, and a few content pages." error={error ?? undefined}>
        <input
          className="input"
          placeholder="acme.com"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && draftIt()}
        />
      </Field>
      <div className="flex items-center gap-3">
        <button className="btn-accent" onClick={draftIt} disabled={!siteUrl.trim()}>
          Draft it for me
        </button>
        <button className="btn-ghost" onClick={startBlank} disabled={!siteUrl.trim()}>
          Start from blank
        </button>
      </div>
      <p className="text-micro text-muted">
        Everything Wire reads is treated as data, never instructions — your Brand Brain is drafted, not dictated to.
      </p>
    </div>
  );
}
