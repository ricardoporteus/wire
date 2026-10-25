"use client";

/**
 * Content — the content hub. Three sections: Recommended (ideas not yet
 * started, the handoff into the writer), Drafts (pieces in flight), and
 * Published (finished pieces).
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { writeThisIdea } from "../dashboard/actions";

type Idea = {
  id: string; title: string; format: string;
  whyNow: string | null; targetAeoQuestion: string | null; rank: number; status: string;
  priority: number;
  doc: { id: string; status: string; done: boolean } | null;
};
type Doc = { id: string; title: string; status: string; updatedAt: string | null };

const PRIORITY_BADGE = (p: number) =>
  p <= 1 ? "badge--attention" : p === 2 ? "badge--opportunity" : "badge--draft";

const STATUS_LABEL: Record<string, string> = {
  diagnosing: "Diagnosing", awaiting_confirm: "Needs confirm", generating: "Writing", draft: "Draft",
};
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

export function ContentClient({
  brainName, ideas, drafts, published,
}: {
  brainName: string;
  ideas: Idea[];
  drafts: Doc[];
  published: Doc[];
}) {
  const router = useRouter();
  const [writing, startWrite] = useTransition();

  const write = (ideaId: string) =>
    startWrite(async () => {
      const { documentId } = await writeThisIdea(ideaId);
      router.push(`/write/${documentId}`);
    });

  // Recommended = ideas you haven't started yet; the started ones live in Drafts.
  const recommended = ideas.filter((i) => i.doc === null);
  const empty = recommended.length === 0 && drafts.length === 0 && published.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <span className="eyebrow">{brainName}</span>
      <h1 className="mt-4 text-h2 text-ink-green">Content</h1>
      <p className="mt-2 text-body-sm text-muted">Everything in flight — what to write next, what&apos;s in progress, and what&apos;s published.</p>
      <a href="/write" className="mt-3 inline-block text-caption font-semibold text-accent-strong">New piece →</a>

      {empty && (
        <p className="mt-10 text-muted">
          Nothing here yet. Run an intelligence sweep from the dashboard, and ranked pieces will appear here.
        </p>
      )}

      {/* Recommended this month */}
      {recommended.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h4 text-ink-green">Recommended this month</h2>
          <p className="mt-1 text-body-sm text-muted">
            {recommended.length} piece{recommended.length === 1 ? "" : "s"}, ranked by opportunity.
          </p>
          <div className="mt-5 grid gap-3">
            {recommended.map((i) => (
              <div key={i.id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${PRIORITY_BADGE(i.priority)}`}>P{i.priority}</span>
                    <h3 className="text-h5 text-ink-green">{i.title}</h3>
                  </div>
                  <p className="mt-2 text-caption text-muted">
                    <span className="badge badge--draft mr-2">{i.format.replaceAll("_", " ")}</span>
                    {i.whyNow}
                  </p>
                  {i.targetAeoQuestion && (
                    <p className="mt-1 text-micro text-muted">Answers: “{i.targetAeoQuestion}”</p>
                  )}
                </div>
                <button className="btn-accent flex-none" disabled={writing} onClick={() => write(i.id)}>
                  {writing ? "Opening…" : "Write this"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <a href="/content/library" className="mt-6 inline-block text-caption font-semibold text-accent-strong">
        Library — exports &amp; repurpose packs →
      </a>

      {/* Drafts */}
      {drafts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h4 text-ink-green">Drafts</h2>
          <p className="mt-1 text-body-sm text-muted">{drafts.length} in progress.</p>
          <div className="mt-5 grid gap-3">
            {drafts.map((d) => (
              <a key={d.id} href={`/write/${d.id}`} className="card flex items-center justify-between gap-4 transition-colors hover:border-accent-strong/40">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge--draft">{STATUS_LABEL[d.status] ?? d.status}</span>
                    <h3 className="truncate text-h5 text-ink-green">{d.title}</h3>
                  </div>
                  <p className="mt-1 text-micro text-muted">Updated {fmtDate(d.updatedAt)}</p>
                </div>
                <span className="flex-none text-caption font-semibold text-accent-strong">Open →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Published */}
      {published.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h4 text-ink-green">Published</h2>
          <p className="mt-1 text-body-sm text-muted">{published.length} finished piece{published.length === 1 ? "" : "s"}.</p>
          <div className="mt-5 grid gap-3">
            {published.map((d) => (
              <a key={d.id} href={`/write/${d.id}`} className="card flex items-center justify-between gap-4 transition-colors hover:border-accent-strong/40">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge--published">Published</span>
                    <h3 className="truncate text-h5 text-ink-green">{d.title}</h3>
                  </div>
                  <p className="mt-1 text-micro text-muted">Updated {fmtDate(d.updatedAt)}</p>
                </div>
                <span className="flex-none text-caption font-semibold text-accent-strong">View →</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
