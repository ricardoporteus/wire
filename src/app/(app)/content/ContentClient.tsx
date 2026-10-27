"use client";

/**
 * Content — the content hub. Three sections: Recommended (ideas not yet
 * started, the handoff into the writer), Drafts (pieces in flight), and
 * Published (finished pieces).
 *
 * For the Mavrix admin org only, Recommended gains a bulk writer: tick several
 * ideas, preview & cue them, then write the whole batch in one run (progress and
 * downloads live on /content/batch/[id]).
 */
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { writeThisIdea } from "../dashboard/actions";
import { writeBulk } from "./bulk-actions";

type Idea = {
  id: string; title: string; format: string;
  whyNow: string | null; targetAeoQuestion: string | null; targetKeyword: string | null;
  rank: number; status: string; priority: number;
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
  isAdmin = false, userEmail = null, creditsBalance = 0, perPieceCredits = 21,
}: {
  brainName: string;
  ideas: Idea[];
  drafts: Doc[];
  published: Doc[];
  isAdmin?: boolean;
  userEmail?: string | null;
  creditsBalance?: number;
  perPieceCredits?: number;
}) {
  const router = useRouter();
  const [writing, startWrite] = useTransition();

  // Recommended = ideas you haven't started yet; the started ones live in Drafts.
  const recommended = useMemo(() => ideas.filter((i) => i.doc === null), [ideas]);
  const empty = recommended.length === 0 && drafts.length === 0 && published.length === 0;

  const write = (ideaId: string) =>
    startWrite(async () => {
      const { documentId } = await writeThisIdea(ideaId);
      router.push(`/write/${documentId}`);
    });

  // --- bulk writer state (admin only) ---
  const [bulk, setBulk] = useState(false);              // bulk selection mode on Recommended
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<"browse" | "preview">("browse");
  const [cue, setCue] = useState<Record<string, "cued" | "discarded">>({});
  const [email, setEmail] = useState(userEmail ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = (on: boolean) => setSelected(on ? new Set(recommended.map((i) => i.id)) : new Set());

  const selectedIdeas = recommended.filter((i) => selected.has(i.id));
  const cuedIds = selectedIdeas.filter((i) => (cue[i.id] ?? "cued") === "cued").map((i) => i.id);
  const cuedCost = cuedIds.length * perPieceCredits;
  const overBudget = cuedCost > creditsBalance;

  const goPreview = () => {
    const seed: Record<string, "cued" | "discarded"> = {};
    selectedIdeas.forEach((i) => { seed[i.id] = "cued"; });
    setCue(seed); setErr(null); setStage("preview");
  };
  const setCueState = (id: string, s: "cued" | "discarded") => setCue((c) => ({ ...c, [id]: s }));

  const submit = () =>
    startSubmit(async () => {
      setErr(null);
      const res = await writeBulk(cuedIds, email || undefined);
      if (res.ok) { router.push(`/content/batch/${res.batchId}`); return; }
      if (res.error === "insufficient_credits")
        setErr(`Not enough credits for ${cuedIds.length} pieces. You can afford ${res.affordable} right now — top up or cue fewer.`);
      else if (res.error === "rate_limited") setErr("Too many requests just now — wait a moment and try again.");
      else if (res.error === "no_ideas") setErr("Cue at least one piece to write.");
      else setErr("Couldn't start the batch. Please try again.");
    });

  // ---------- PREVIEW & CUE STAGE ----------
  if (isAdmin && stage === "preview") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <span className="eyebrow">{brainName} · Bulk writer</span>
        <h1 className="mt-4 text-h2 text-ink-green">Here&apos;s what these should become</h1>
        <p className="mt-2 text-body-sm text-muted">
          Cue the pieces to write and discard the rest. Nothing spends credits until you press Write All.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {selectedIdeas.map((i) => {
            const state = cue[i.id] ?? "cued";
            return (
              <div
                key={i.id}
                className={`card flex items-start justify-between gap-4 border-l-4 ${
                  state === "cued" ? "border-l-lime" : "border-l-transparent opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <span className="badge badge--draft">{i.format.replaceAll("_", " ")}</span>
                  <h3 className={`mt-2 text-h5 text-ink-green ${state === "discarded" ? "line-through" : ""}`}>{i.title}</h3>
                  {i.whyNow && <p className="mt-1 text-caption text-muted">{i.whyNow}</p>}
                  <div className="mt-2 grid gap-0.5 text-micro text-muted">
                    {i.targetKeyword && <p><span className="font-semibold text-ink-green">Target keyword:</span> {i.targetKeyword}</p>}
                    {i.targetAeoQuestion && <p><span className="font-semibold text-ink-green">Answers:</span> “{i.targetAeoQuestion}”</p>}
                  </div>
                </div>
                <div className="flex flex-none gap-2">
                  <button
                    aria-pressed={state === "cued"}
                    onClick={() => setCueState(i.id, "cued")}
                    title="Cue to write"
                    className={`grid h-9 w-9 place-items-center rounded-lg border text-base ${
                      state === "cued" ? "border-transparent bg-[var(--color-ink-green)] text-white" : "border-line bg-white text-ink-green"
                    }`}
                  >✓</button>
                  <button
                    aria-pressed={state === "discarded"}
                    onClick={() => setCueState(i.id, "discarded")}
                    title="Discard"
                    className={`grid h-9 w-9 place-items-center rounded-lg border text-base ${
                      state === "discarded" ? "border-transparent bg-[#D0463B] text-white" : "border-line bg-white text-ink-green"
                    }`}
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* commit bar */}
        <div className="mt-6 card flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor="notify" className="block text-micro font-medium text-muted">Email me when the batch is done</label>
            <input
              id="notify" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input mt-1 w-72 max-w-full"
            />
          </div>
          <div className="text-right">
            <p className={`text-caption ${overBudget ? "text-[#D0463B]" : "text-muted"}`}>
              {cuedIds.length} cued · ~{cuedCost} credits <span className="text-micro">({perPieceCredits}/piece)</span>
            </p>
            <p className="text-micro text-muted">Balance: {creditsBalance}</p>
          </div>
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <button className="btn-ghost" onClick={() => setStage("browse")} disabled={submitting}>Back</button>
            <button
              className="btn-primary"
              onClick={submit}
              disabled={submitting || cuedIds.length === 0 || overBudget}
            >
              {submitting ? "Starting…" : `Write All (${cuedIds.length})`}
            </button>
          </div>
        </div>
        {err && <p className="mt-3 text-caption text-[#D0463B]">{err}</p>}
      </main>
    );
  }

  // ---------- BROWSE STAGE ----------
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-h4 text-ink-green">Recommended this month</h2>
              <p className="mt-1 text-body-sm text-muted">
                {recommended.length} piece{recommended.length === 1 ? "" : "s"}, ranked by opportunity.
              </p>
            </div>
            {isAdmin && (
              <button
                className={bulk ? "btn-ghost" : "btn-accent"}
                onClick={() => { setBulk((b) => !b); setSelected(new Set()); }}
              >
                {bulk ? "Cancel bulk" : "Bulk write"}
              </button>
            )}
          </div>

          {/* bulk selection bar */}
          {isAdmin && bulk && (
            <div className="mt-4 card flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-caption font-medium text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-accent-strong)]"
                  checked={selected.size === recommended.length && recommended.length > 0}
                  onChange={(e) => selectAll(e.target.checked)}
                />
                Select all
              </label>
              <span className="text-caption text-muted">
                {selected.size} selected · ~{selected.size * perPieceCredits} credits
              </span>
              <button className="btn-primary" disabled={selected.size === 0} onClick={goPreview}>
                Preview &amp; cue ({selected.size})
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            {recommended.map((i) => (
              <div key={i.id} className="card flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  {isAdmin && bulk && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 flex-none accent-[var(--color-accent-strong)]"
                      checked={selected.has(i.id)}
                      onChange={() => toggle(i.id)}
                    />
                  )}
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
                </div>
                {!bulk && (
                  <button className="btn-accent flex-none" disabled={writing} onClick={() => write(i.id)}>
                    {writing ? "Opening…" : "Write this"}
                  </button>
                )}
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
          <div className="mt-5 flex flex-col gap-3">
            {drafts.map((d) => (
              <a key={d.id} href={`/write/${d.id}`} className="card flex items-center justify-between gap-4 transition-colors hover:border-accent-strong/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge--draft flex-none">{STATUS_LABEL[d.status] ?? d.status}</span>
                    <h3 className="min-w-0 truncate text-h5 text-ink-green">{d.title}</h3>
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
          <div className="mt-5 flex flex-col gap-3">
            {published.map((d) => (
              <a key={d.id} href={`/write/${d.id}`} className="card flex items-center justify-between gap-4 transition-colors hover:border-accent-strong/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge--published flex-none">Published</span>
                    <h3 className="min-w-0 truncate text-h5 text-ink-green">{d.title}</h3>
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
