import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, brandBrains, organizations, exports as exportsTable } from "@/db/schema";
import { WriterFlow } from "./WriterFlow";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return null;

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!doc) notFound();

  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, doc.brainId) });
  const org = brain && (await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) }));
  if (!org || org.clerkOrgId !== clerkOrgId) notFound();

  const exportRows = await db.query.exports.findMany({
    where: eq(exportsTable.documentId, doc.id),
    orderBy: [exportsTable.createdAt],
  });

  return (
    <WriterFlow
      documentId={doc.id}
      brainName={brain!.name}
      initialExports={exportRows.map((r) => ({ id: r.id, kind: r.kind, content: r.content ?? "" }))}
      initial={{
        status: doc.status,
        format: doc.format,
        diagnosis: doc.diagnosis ?? null,
        title: doc.title ?? null,
        bodyMarkdown: doc.bodyMarkdown ?? null,
        brief: doc.brief ?? null,
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
      }}
    />
  );
}
