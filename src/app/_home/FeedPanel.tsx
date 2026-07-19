/**
 * The live "Intelligence run" feed panel that sits in the hero.
 *
 * Lines are representative rather than a recording, but the shapes are exactly
 * what the real feed emits during a sweep: a search is issued, a source is read,
 * a stage completes with its counts, an idea list gets refined. Copy lives in
 * content.ts.
 *
 * Pure CSS animation, no client JS, so this stays a server component. Global CSS
 * disables the scroll under prefers-reduced-motion.
 */
import { FEED } from "./content";

/** Maps a line type to the status badge that colours its dot. */
const DOT = {
  search: "badge--opportunity",
  source: "badge--draft",
  ok: "badge--published",
  refine: "badge--queued",
} as const;

export function FeedPanel() {
  return (
    <div className="card card--lg mx-auto w-full max-w-[520px] overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="font-display text-h5 font-semibold text-ink-green">{FEED.title}</p>
        <span className="badge badge--published">{FEED.status}</span>
      </div>
      <p className="mt-1 text-caption text-muted">{FEED.meta}</p>

      <div className="feed-window mt-5 h-[280px] overflow-hidden md:h-[320px]">
        {/* Duplicated so the loop is seamless: the track scrolls exactly half its height. */}
        <div className="feed-track">
          {[...FEED.lines, ...FEED.lines].map((line, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <span className={`badge ${DOT[line.t as keyof typeof DOT]} mt-0.5 shrink-0`} />
              <span className="text-body-sm text-ink">{line.s}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .feed-window {
          -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent);
                  mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent);
        }
        .feed-track { animation: feed-scroll 26s linear infinite; }
        @keyframes feed-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      `}</style>
    </div>
  );
}
