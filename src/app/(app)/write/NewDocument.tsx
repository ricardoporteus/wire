"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createFromPaste, createFromUrl, createFromMediaLink, createFromUpload } from "./actions";
import { UpgradeNotice } from "@/components/UpgradeNotice";
import { CREDIT_COSTS } from "@/lib/credit-costs";

const MAX_UPLOAD_MB = 500;

type Mode = "write" | "convert";
type ConvertKind = "url" | "media";

// What actually works today. Spotify/Apple player pages are NOT downloadable, so
// they're deliberately excluded (the note under the badges spells that out).
const MEDIA_PLATFORMS = ["YouTube", "Podcast RSS / episode", "Google Drive · Dropbox file", "MP3 · M4A · WAV", "MP4 · MOV · WEBM"];

export function NewDocument({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("write");
  const [convertKind, setConvertKind] = useState<ConvertKind>("media");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [media, setMedia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  // Upload a local audio/video file straight to Blob, then transcribe + write it
  // through the same pipeline a pasted media link uses.
  const onFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_UPLOAD_MB} MB. Split it into shorter parts.`);
      return;
    }
    setUploading(true);
    setUploadPct(0);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type || undefined,
        onUploadProgress: (p) => setUploadPct(Math.round(p.percentage)),
      });
      const res = await createFromUpload({ url: blob.url, filename: file.name, contentType: file.type });
      if (res.ok) { router.push(`/write/${res.documentId}`); return; }
      setError(res.error === "forbidden" ? "File upload isn't enabled for this workspace yet." : res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const go = () =>
    start(async () => {
      setError(null);
      const res =
        mode === "write" ? await createFromPaste(text)
        : convertKind === "url" ? await createFromUrl(url)
        : await createFromMediaLink(media);
      if (res.ok) router.push(`/write/${res.documentId}`);
      else setError(res.error);
    });

  const mediaMode = mode === "convert" && convertKind === "media";
  const btnLabel = pending ? (mediaMode ? "Transcribing…" : "Diagnosing…") : mediaMode ? "Transcribe & write" : "Diagnose & write";
  const costNote = mediaMode
    ? `Transcription ${CREDIT_COSTS.transcription} credits · diagnosis 1 · generation 20.`
    : "Diagnosis costs 1 credit · generation 20.";

  return (
    <div className="mt-8">
      {/* ---- Write | Convert ---- */}
      <div className="flex flex-wrap gap-1" role="tablist">
        <button role="tab" aria-selected={mode === "write"} className="tab" onClick={() => setMode("write")}>Write</button>
        <button role="tab" aria-selected={mode === "convert"} className="tab" onClick={() => setMode("convert")}>Convert</button>
      </div>

      {/* ---- Write: paste your own material ---- */}
      {mode === "write" && (
        <div className="mt-4">
          <textarea
            className="input min-h-[220px] font-body"
            placeholder="Paste a transcript, notes, a rough draft, a voice-note dump — anything. Mavrix finds the piece inside it."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      )}

      {/* ---- Convert: a link or media into a draft ---- */}
      {mode === "convert" && (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="What to convert">
            <button role="tab" aria-selected={convertKind === "media"} className="tab" onClick={() => setConvertKind("media")}>
              Audio, video &amp; podcast
            </button>
            <button role="tab" aria-selected={convertKind === "url"} className="tab" onClick={() => setConvertKind("url")}>
              Web URL
            </button>
          </div>

          {convertKind === "media" ? (
            <input
              className="input"
              placeholder="Paste a YouTube link, a podcast RSS/episode, a Google Drive/Dropbox file, or a direct audio/video file URL"
              value={media}
              onChange={(e) => setMedia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
          ) : (
            <input
              className="input"
              placeholder="https://example.com/article-to-repurpose"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
          )}

          {/* ---- Upload a local file (admin) ---- */}
          {convertKind === "media" && isAdmin && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }}
              />
              <button
                type="button"
                className="btn-ghost"
                disabled={uploading || pending}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? `Uploading… ${uploadPct}%` : "Upload a file"}
              </button>
              <span className="text-micro text-muted">
                or paste a link above · MP3 · M4A · WAV · MP4 · MOV · WEBM · up to {MAX_UPLOAD_MB} MB
              </span>
            </div>
          )}

          {/* ---- Details: what it does, what works, example, output ---- */}
          <div className="card mt-4 bg-bg-alt">
            <p className="text-body-sm text-ink">
              {convertKind === "media"
                ? "Turn an interview, podcast, webinar or talk into a publish-ready article. Mavrix transcribes the recording, then diagnoses the best angle and writes it in your brand voice."
                : "Turn an existing article or blog post into a new, on-brand piece. Mavrix reads the page, then diagnoses the angle and rewrites it in your voice."}
            </p>

            <p className="mt-4 text-micro font-medium uppercase tracking-wide text-muted">What works</p>
            {convertKind === "media" ? (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MEDIA_PLATFORMS.map((p) => (
                    <span key={p} className="badge badge--draft">{p}</span>
                  ))}
                </div>
                <p className="mt-2 text-micro text-muted">
                  Not supported: Spotify &amp; Apple Podcasts player links (they&apos;re not downloadable).
                  Paste the show&apos;s RSS feed or its YouTube version instead.
                </p>
              </>
            ) : (
              <p className="mt-2 text-body-sm text-muted">Any public article or blog post with readable text.</p>
            )}

            <p className="mt-4 text-micro font-medium uppercase tracking-wide text-muted">Example</p>
            <p className="mt-1 text-body-sm text-muted">
              {convertKind === "media"
                ? "Paste a 30-minute podcast episode or a YouTube talk — say, a founder interview about your product."
                : "Paste a competitor explainer or an old blog post you want to refresh."}
            </p>

            <p className="mt-4 text-micro font-medium uppercase tracking-wide text-muted">What you&apos;ll get</p>
            <p className="mt-1 text-body-sm text-muted">
              A publish-ready draft (article, listicle, how-to and more) in your brand voice, fact-checked against your
              approved facts, with an SEO title, meta description and alt text — plus one-click repurpose packs for
              LinkedIn, X and your newsletter.
            </p>
          </div>
        </div>
      )}

      {error === "insufficient_credits"
        ? <UpgradeNotice className="mt-3" />
        : error && <p className="mt-3 text-body-sm text-negative">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn-accent" disabled={pending} onClick={go}>{btnLabel}</button>
        <span className="text-micro text-muted">{costNote}</span>
      </div>
    </div>
  );
}
