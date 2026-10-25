"use client";

/**
 * Content — the ranked "recommended this month" queue, the handoff into the
 * writer. Lifted out of the dashboard into its own page.
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

const PRIORITY_BADGE = (p: number) =>
  p <= 1 ? "badge--attention" : p === 2 ? "badge--opportunity" : "badge--draft";

export function ContentClient({ brainName, ideas }: { brainName: string; ideas: Idea[] }) {
  const router = useRouter();
  const [writing, startWrite] = useTransition();

  const write = (ideaId: string) =>
    startWrite(async () => {
      const { documentId } = await writeThisIdea(ideaId);
      router.push(`/write/${documentId}`);
    });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <span className="eyebrow">{brainName}</span>
      <h1 className="mt-4 text-h2 text-ink-green">Content</h1>
      <p className="mt-2 text-body-sm text-muted">
        Recommended this month — {ideas.length} piece{ideas.length === 1 ? "" : "s"}, ranked by opportunity.
      </p>

      {ideas.length === 0 ? (
        <p className="mt-10 text-muted">
          No ideas yet. Run an intelligence sweep from the dashboard, and ranked pieces will appear here.
        </p>
      ) : (
        <div className="mt-8 grid gap-3">
          {ideas.map((i) => (
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
              {/* Three states: not started, in flight, done. The last two link
                  straight back to the draft so leaving the page never loses it. */}
              {i.doc === null ? (
                <button className="btn-accent flex-none" disabled={writing} onClick={() => write(i.id)}>
                  {writing ? "Opening…" : "Write this"}
                </button>
              ) : i.doc.done ? (
                <a
                  href={`/write/${i.doc.id}`}
                  className="flex-none rounded-pill bg-positive px-6 py-3.5 font-display text-[15px] font-semibold text-ink-green"
                >
                  Completed
                </a>
              ) : (
                <a href={`/write/${i.doc.id}`} className="btn-ghost flex-none whitespace-nowrap">
                  In progress →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
