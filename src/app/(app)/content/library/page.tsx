/**
 * Content › Library — every repurpose pack and export, across all pieces, in
 * one place. Grouped by piece; downloads (md/html/docx) are generated on demand
 * by the export route.
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, documents, exports as exportsTable } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) redirect("/onboarding");

  const { org } = await requireOrg();
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain?.wizardCompletedAt) redirect("/onboarding");

  const docs = await db.query.documents.findMany({
    where: eq(documents.brainId, brain.id),
    orderBy: [desc(documents.updatedAt)],
  });
  const docIds = docs.map((d) => d.id);
  const rows = docIds.length
    ? await db.select().from(exportsTable).where(inArray(exportsTable.documentId, docIds)).orderBy(desc(exportsTable.createdAt))
    : [];

  const byDoc = new Map<string, { kind: string; content: string | null }[]>();
  for (const r of rows) {
    const arr = byDoc.get(r.documentId) ?? [];
    arr.push({ kind: r.kind, content: r.content });
    byDoc.set(r.documentId, arr);
  }
  // Keep the newest-updated doc order; only pieces that actually have exports.
  const groups = docs
    .filter((d) => byDoc.has(d.id))
    .map((d) => ({ docId: d.id, title: d.title ?? "Untitled piece", exports: byDoc.get(d.id)! }));

  return <LibraryClient groups={groups} />;
}
