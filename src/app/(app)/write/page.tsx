/**
 * Write — start a new piece, and the index of everything already written.
 *
 * The list matters more than it looks. A draft used to be reachable only by its
 * own URL: start a piece, navigate away, and there was no route back to it from
 * anywhere in the app, so work in flight looked lost.
 */
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains, documents } from "@/db/schema";
import { formatDateTime } from "@/lib/seo-labels";
import { NewDocument } from "./NewDocument";

const STATUS_LABEL: Record<string, string> = {
  diagnosing: "Planning",
  awaiting_confirm: "Waiting for you",
  generating: "Writing",
  draft: "Draft ready",
  final: "Final",
  archived: "Archived",
};

const STATUS_BADGE = (s: string) =>
  s === "draft" || s === "final" ? "badge--published"
  : s === "awaiting_confirm" ? "badge--attention"
  : s === "archived" ? "badge--draft"
  : "badge--queued";

const IN_FLIGHT = new Set(["diagnosing", "awaiting_confirm", "generating"]);

type DocRow = { id: string; title: string | null; status: string; format: string; updatedAt: Date };

export default async function WritePage() {
  const { orgId: clerkOrgId } = await auth();
  const org = clerkOrgId
    ? await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) })
    : null;
  const brain = org
    ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) })
    : null;
  const docs: DocRow[] = brain
    ? await db.query.documents.findMany({
        where: eq(documents.brainId, brain.id),
        orderBy: [desc(documents.updatedAt)],
        limit: 50,
      })
    : [];

  const inFlight = docs.filter((d) => IN_FLIGHT.has(d.status));
  const finished = docs.filter((d) => !IN_FLIGHT.has(d.status));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <span className="eyebrow">Write</span>
      <h1 className="mt-4 text-h2 text-ink-green">Start a new piece</h1>
      <p className="mt-2 text-muted">
        Paste your material or drop in a URL. Wire diagnoses what it should become, grounded in your live
        keyword intelligence and Brand Brain, before it writes a word.
      </p>
      <NewDocument />

      {inFlight.length > 0 && <DocList title="In progress" docs={inFlight} />}
      {finished.length > 0 && <DocList title="Written" docs={finished} />}
    </main>
  );
}

function DocList({ title, docs }: { title: string; docs: DocRow[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-h4 text-ink-green">
        {title}
        <span className="ml-2 text-body-sm font-normal text-muted">{docs.length}</span>
      </h2>
      <div className="mt-4 grid gap-3">
        {docs.map((d) => (
          <Link
            key={d.id}
            href={`/write/${d.id}`}
            className="card flex items-center justify-between gap-4 transition hover:border-accent-strong"
          >
            <div className="min-w-0">
              <p className="truncate text-h5 text-ink-green">{d.title ?? "Untitled piece"}</p>
              <p className="mt-1 text-caption text-muted">
                {d.format.replaceAll("_", " ")} · {formatDateTime(d.updatedAt)}
              </p>
            </div>
            <span className={`badge flex-none ${STATUS_BADGE(d.status)}`}>
              {STATUS_LABEL[d.status] ?? d.status}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
