/**
 * Turn a media link into text.
 *
 * Three source shapes, three paths, in increasing order of difficulty:
 *
 *   1. A direct media file  (.mp3 / .mp4 / .m4a / …)  → AssemblyAI.
 *   2. A podcast RSS feed or episode enclosure         → find the file, then (1).
 *   3. A YouTube link                                  → captions first (free,
 *      works when the video has them and YouTube does not block the request),
 *      then a commercial transcript API if one is configured, and otherwise a
 *      clear error rather than a silent failure.
 *
 * AssemblyAI cannot take a YouTube or Spotify page: those are not files. That is
 * the whole reason path 3 exists and is harder than the other two.
 *
 * Everything here runs server-side only, inside an Inngest step, never in a
 * request handler: a podcast can take minutes to transcribe.
 */

/** Treat blank or a REPLACE_ME placeholder as "not configured". */
const envKey = (v: string | undefined) => (v && !v.startsWith("REPLACE") ? v : undefined);

const ASSEMBLYAI_KEY = envKey(process.env.ASSEMBLYAI_API_KEY);
const SUPADATA_KEY = envKey(process.env.SUPADATA_API_KEY); // optional; enables reliable YouTube

/** Hard ceiling so one giant file cannot run up an unbounded AssemblyAI bill. */
export const MAX_AUDIO_SECONDS = 4 * 60 * 60; // 4 hours

export type Transcript = { text: string; durationSec: number; via: string };

export class TranscriptionError extends Error {}

/* -------------------------------------------------------------------------- */
/* Public entry point                                                         */
/* -------------------------------------------------------------------------- */

export async function transcribeMedia(url: string): Promise<Transcript> {
  const clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    throw new TranscriptionError("That does not look like a valid link.");
  }

  if (isYouTube(clean)) return transcribeYouTube(clean);

  // Apple Podcasts player pages aren't files, but Apple's public lookup API maps
  // the show (and a specific episode, when the link names one) to a real RSS
  // feed / enclosure we can transcribe.
  if (isApplePodcast(clean)) {
    const resolved = await resolveApplePodcast(clean);
    if (!resolved) {
      throw new TranscriptionError(
        "Couldn't find this show in Apple's directory. Paste the show's RSS feed instead.",
      );
    }
    const mediaUrl = resolved.episodeUrl ?? (await resolveToMediaFile(resolved.feedUrl!));
    return transcribeWithAssemblyAI(mediaUrl);
  }

  // Podcast feeds and episode pages resolve to a direct enclosure; direct files
  // pass straight through.
  const mediaUrl = await resolveToMediaFile(clean);
  return transcribeWithAssemblyAI(mediaUrl);
}

/* -------------------------------------------------------------------------- */
/* Apple Podcasts → RSS feed / episode enclosure                              */
/* -------------------------------------------------------------------------- */

function isApplePodcast(url: string) {
  return /(?:podcasts|music)\.apple\.com\//i.test(url);
}

/**
 * Resolve an Apple Podcasts URL to something AssemblyAI can fetch, using Apple's
 * free iTunes lookup API (no key). The URL shape is
 *   podcasts.apple.com/<country>/podcast/<slug>/id<showId>[?i=<episodeId>]
 * The trailing /id<digits> is the SHOW id; ?i=<digits> names an episode.
 *
 * Apple exposes no lookup by episode id alone, so we always resolve the show,
 * then (if an episode is named) pull that show's recent episodes and match the
 * id to its direct enclosure. When the named episode isn't in the recent window,
 * we fall back to the feed (its latest episode) rather than failing.
 */
async function resolveApplePodcast(url: string): Promise<{ feedUrl?: string; episodeUrl?: string } | null> {
  const showId = url.match(/\/id(\d+)/)?.[1] ?? url.match(/[?&]id=(\d+)/)?.[1];
  if (!showId) return null;
  const episodeId = url.match(/[?&]i=(\d+)/)?.[1];

  const lookup = async (params: string): Promise<Record<string, unknown>[]> => {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?${params}`, {
        headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
      });
      if (!r.ok) return [];
      return ((await r.json()) as { results?: Record<string, unknown>[] }).results ?? [];
    } catch {
      return [];
    }
  };

  const showRes = await lookup(`id=${showId}&entity=podcast`);
  const feedUrl = showRes.find((r) => typeof r.feedUrl === "string")?.feedUrl as string | undefined;

  if (episodeId) {
    const eps = await lookup(`id=${showId}&entity=podcastEpisode&limit=200`);
    const match = eps.find((r) => String(r.trackId) === episodeId);
    const episodeUrl = match?.episodeUrl;
    if (typeof episodeUrl === "string" && episodeUrl) return { feedUrl, episodeUrl };
  }
  return feedUrl ? { feedUrl } : null;
}

/* -------------------------------------------------------------------------- */
/* 1. AssemblyAI — direct media file                                          */
/* -------------------------------------------------------------------------- */

async function transcribeWithAssemblyAI(mediaUrl: string): Promise<Transcript> {
  if (!ASSEMBLYAI_KEY || ASSEMBLYAI_KEY.startsWith("REPLACE")) {
    throw new TranscriptionError("Transcription is not configured (missing AssemblyAI key).");
  }

  const submit = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: { authorization: ASSEMBLYAI_KEY, "content-type": "application/json" },
    // speech_model (singular) is deprecated; the API wants a speech_models list.
    body: JSON.stringify({ audio_url: mediaUrl, speech_models: ["universal-2"] }),
  });
  if (!submit.ok) {
    throw new TranscriptionError(`Could not start transcription (${submit.status}). Check the link is a public audio or video file.`);
  }
  const { id } = (await submit.json()) as { id: string };

  // Poll. AssemblyAI transcribes roughly in real time for the universal model,
  // so a 30-minute podcast is minutes of polling. The Inngest step's own timeout
  // bounds the worst case; here we cap the loop as a backstop.
  const started = Date.now();
  const DEADLINE_MS = 30 * 60 * 1000;
  while (Date.now() - started < DEADLINE_MS) {
    await sleep(4000);
    const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_KEY },
    });
    if (!poll.ok) continue; // transient; keep polling
    const t = (await poll.json()) as {
      status: string; text?: string; error?: string; audio_duration?: number;
    };
    if (t.status === "completed") {
      const durationSec = Math.round(t.audio_duration ?? 0);
      if (durationSec > MAX_AUDIO_SECONDS) {
        throw new TranscriptionError(`That recording is over ${Math.floor(MAX_AUDIO_SECONDS / 3600)} hours. Split it into shorter parts.`);
      }
      const text = (t.text ?? "").trim();
      if (!text) throw new TranscriptionError("Transcription came back empty — the file may have no speech.");
      return { text, durationSec, via: "assemblyai" };
    }
    if (t.status === "error") {
      throw new TranscriptionError(t.error?.slice(0, 200) || "Transcription failed.");
    }
  }
  throw new TranscriptionError("Transcription timed out.");
}

/* -------------------------------------------------------------------------- */
/* 2. Podcast / direct file resolution                                        */
/* -------------------------------------------------------------------------- */

const AUDIO_EXT = /\.(mp3|m4a|mp4|wav|aac|ogg|flac|webm|mov)(\?|#|$)/i;

/**
 * Rewrite common share links to a direct-download URL AssemblyAI can fetch.
 * Google Drive and Dropbox "share" pages serve HTML, not the file, so a raw
 * paste used to fail with a confusing "not a direct file" error — these were the
 * most common real failures. Unknown links pass through unchanged.
 */
export function rewriteShareLink(url: string): string {
  // Google Drive: .../file/d/<id>/view, /open?id=<id>, usercontent /open?id=<id>
  const driveId =
    url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ||
    url.match(/drive\.(?:google|usercontent\.google)\.com\/(?:open|uc|download)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/)?.[1];
  if (driveId) return `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;

  // Dropbox: force a direct download via the direct host with dl=1.
  if (/dropbox\.com\//i.test(url)) {
    let d = url.replace(/^https?:\/\/(?:www\.)?dropbox\.com/i, "https://dl.dropboxusercontent.com");
    if (/[?&]dl=0\b/i.test(d)) d = d.replace(/([?&])dl=0\b/i, "$1dl=1");
    else if (!/[?&]dl=1\b/i.test(d)) d += (d.includes("?") ? "&" : "?") + "dl=1";
    return d;
  }
  return url;
}

/**
 * A direct media file is returned unchanged. An RSS feed (or a link that serves
 * XML) is parsed for its first audio enclosure. Anything else is rejected with a
 * message, rather than handed to AssemblyAI to fail obscurely.
 */
async function resolveToMediaFile(input: string): Promise<string> {
  const url = rewriteShareLink(input);
  if (AUDIO_EXT.test(url)) return url;

  // Probe the content type. Some podcast hosts serve files without an extension.
  let contentType = "";
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    contentType = head.headers.get("content-type") ?? "";
  } catch {
    /* fall through to a GET-based sniff below */
  }
  if (contentType.startsWith("audio/") || contentType.startsWith("video/")) return url;

  // Treat it as a feed and look for an enclosure.
  const res = await fetch(url, { redirect: "follow" });
  const body = await res.text();
  const type = res.headers.get("content-type") ?? contentType;
  if (type.includes("xml") || body.includes("<rss") || body.includes("<enclosure")) {
    const enclosure = body.match(/<enclosure[^>]*\burl=["']([^"']+)["'][^>]*>/i);
    if (enclosure?.[1]) return enclosure[1];
    const media = body.match(/<media:content[^>]*\burl=["']([^"']+\.(?:mp3|m4a|mp4))["']/i);
    if (media?.[1]) return media[1];
    throw new TranscriptionError("Found a feed but no audio file in it. Paste the direct episode link.");
  }

  throw new TranscriptionError(
    "That link isn't a direct audio or video file. Paste a direct file URL (MP3, M4A, MP4…), a podcast RSS/episode link, " +
      "a Google Drive or Dropbox file link, or a YouTube URL — not a Spotify/Apple player page.",
  );
}

/* -------------------------------------------------------------------------- */
/* 3. YouTube                                                                 */
/* -------------------------------------------------------------------------- */

function isYouTube(url: string) {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url);
}

function youTubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function transcribeYouTube(url: string): Promise<Transcript> {
  const id = youTubeId(url);
  if (!id) throw new TranscriptionError("Could not read the video id from that YouTube link.");

  // Captions first: free, instant, and enough for most talks and podcasts that
  // publish captions. Fails quietly (returns null) when the video has none or
  // YouTube blocks this server's IP, which is common from cloud hosts.
  const captions = await tryYouTubeCaptions(id).catch(() => null);
  if (captions && captions.length > 40) {
    return { text: captions, durationSec: 0, via: "youtube-captions" };
  }

  // Commercial fallback, only if a key is configured. This is the reliable path
  // for production; without it, uncaptioned or IP-blocked videos cannot be read.
  if (SUPADATA_KEY) {
    const text = await supadataTranscript(id);
    return { text, durationSec: 0, via: "supadata" };
  }

  throw new TranscriptionError(
    "Could not get this video's transcript. It may have no captions, or YouTube blocked the request. " +
      "A YouTube transcript API key (SUPADATA_API_KEY) makes this reliable.",
  );
}

/**
 * Pull YouTube's own caption track by scraping the watch page for the timedtext
 * URL. Deliberately best-effort: YouTube changes this and rate-limits datacenter
 * IPs, so any failure returns null and the caller falls back.
 */
async function tryYouTubeCaptions(id: string): Promise<string | null> {
  const page = await fetch(`https://www.youtube.com/watch?v=${id}`, {
    headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en" },
  });
  const html = await page.text();
  const m = html.match(/"captionTracks":(\[.*?\])/);
  if (!m) return null;

  let tracks: { baseUrl?: string; languageCode?: string }[];
  try {
    tracks = JSON.parse(m[1].replace(/\\u0026/g, "&"));
  } catch {
    return null;
  }
  const track = tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];
  if (!track?.baseUrl) return null;

  const xml = await (await fetch(track.baseUrl)).text();
  const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((mm) =>
    decodeEntities(mm[1]),
  );
  return lines.join(" ").replace(/\s+/g, " ").trim() || null;
}

/** Supadata: GET /v1/youtube/transcript?videoId=…, x-api-key header. */
async function supadataTranscript(id: string): Promise<string> {
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${id}&text=true`,
    { headers: { "x-api-key": SUPADATA_KEY! } },
  );
  if (!res.ok) {
    throw new TranscriptionError(`YouTube transcript service returned ${res.status}.`);
  }
  const data = (await res.json()) as
    | { content?: string | { text: string }[] }
    | Record<string, unknown>;
  const content = (data as { content?: unknown }).content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((c) => (c as { text: string }).text).join(" ")
        : "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) throw new TranscriptionError("YouTube transcript came back empty.");
  return clean;
}

/* -------------------------------------------------------------------------- */

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
