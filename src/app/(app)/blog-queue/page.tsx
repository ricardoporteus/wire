/**
 * Blog Schedule — the review-gate queue for the public Resources library.
 *
 * Read-only by design: it reads the content layer (not the per-org DB), so it
 * shows the whole publishing pipeline at a glance — what is awaiting review,
 * what is scheduled to drip out and when, and what is already live. Approving a
 * draft or moving a date is a content edit (flip `status`/`publishAt` on the
 * article); this page is the surface you review before and after that.
 */
import Link from "next/link";
import { getQueue, CATEGORY_BY_SLUG, TYPE_LABEL, AUTHORS } from "@/content/resources";
import type { QueueItem, QueueLane } from "@/content/resources";

const SITE = "https://mavrix.agency";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmt(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
/** Relative to today, in whole days (UTC). */
function rel(iso: string): string {
  const day = 86_400_000;
  const then = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso).getTime();
  const now = Date.now();
  const diff = Math.round((then - Math.floor(now / day) * day) / day);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export default async function BlogQueuePage() {
  const queue = await getQueue();
  const drafts = queue.filter((q) => q.lane === "draft");
  const scheduled = queue.filter((q) => q.lane === "scheduled"); // already sorted soonest-first
  const live = queue.filter((q) => q.lane === "live").reverse(); // newest live first

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">Blog Schedule · Quill · Ada</span>
      <h1 className="mt-4 text-h2 text-ink-green">Blog Schedule</h1>
      <p className="mt-2 max-w-2xl text-body-sm text-muted">
        The review gate for your public <Link href={`${SITE}/resources`} className="font-semibold text-accent-strong">Resources library</Link>.
        Drafts stay private until approved. Scheduled pieces go live automatically on their date, no deploy needed.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Stat n={drafts.length} label="Awaiting review" />
        <Stat n={scheduled.length} label="Scheduled" />
        <Stat n={live.length} label="Live" />
      </div>

      <Section title="Awaiting review" hint="Converted, not yet approved. Private until scheduled." items={drafts} lane="draft" empty="Nothing waiting. Drop exports and I'll queue them here as drafts." />
      <Section title="Scheduled" hint="Approved. Each goes live automatically on its date." items={scheduled} lane="scheduled" empty="No upcoming posts scheduled yet." />
      <Section title="Live" hint="Published and public now." items={live} lane="live" empty="No live articles yet." />
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <div className="text-h3 tabular-nums text-ink-green">{n}</div>
      <div className="text-micro text-muted">{label}</div>
    </div>
  );
}

function Section({ title, hint, items, lane, empty }: {
  title: string; hint: string; items: QueueItem[]; lane: QueueLane; empty: string;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <h2 className="text-h4 text-ink-green">{title} <span className="tabular-nums text-muted">({items.length})</span></h2>
        <span className="text-micro text-muted">{hint}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-body-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((q) => <Row key={`${q.category}/${q.slug}`} q={q} lane={lane} />)}
        </ul>
      )}
    </section>
  );
}

function Row({ q, lane }: { q: QueueItem; lane: QueueLane }) {
  const cat = CATEGORY_BY_SLUG[q.category];
  const author = AUTHORS[q.author];
  const href = `${SITE}/resources/${q.category}/${q.slug}`;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
      <span className="min-w-[8rem] shrink-0 text-caption tabular-nums text-muted">
        {fmt(q.publishAt)}
        {lane === "scheduled" && <span className="ml-1 text-accent-strong">· {rel(q.publishAt)}</span>}
      </span>
      <span className="flex-1 min-w-[16rem] text-body-sm font-medium text-ink">
        {lane === "live"
          ? <Link href={href} className="hover:text-accent-strong">{q.title}</Link>
          : q.title}
      </span>
      <span className="text-micro text-muted">{cat.name}</span>
      <span className="text-micro text-muted">· {TYPE_LABEL[q.type]}</span>
      <span className="text-micro text-muted">· {author.name}</span>
    </li>
  );
}
