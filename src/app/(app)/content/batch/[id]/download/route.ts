/**
 * Bulk download — zips every finished piece in a batch as Markdown, HTML and
 * Word (each with its content brief appended), grouped in a folder per article.
 * Mavrix-admin only, org-scoped. No AI, no credits.
 */
import JSZip from "jszip";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, writeBatches, organizations } from "@/db/schema";
import { requireOrg, isResourcesAdminOrg } from "@/lib/org";
import { renderExport, slugify, type Brief } from "@/lib/export-doc";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return new Response("Unauthorized", { status: 401 });

  const { org } = await requireOrg();
  if (!isResourcesAdminOrg(org)) return new Response("Forbidden", { status: 403 });

  const batch = await db.query.writeBatches.findFirst({ where: eq(writeBatches.id, id) });
  if (!batch) return new Response("Not found", { status: 404 });
  // Ownership: batch.orgId → clerk org.
  const ownerOrg = await db.query.organizations.findFirst({ where: eq(organizations.id, batch.orgId) });
  if (!ownerOrg || ownerOrg.clerkOrgId !== clerkOrgId) return new Response("Forbidden", { status: 403 });

  const docs = (await db.query.documents.findMany({ where: eq(documents.batchId, id) }))
    .filter((d) => d.bodyMarkdown && (d.status === "draft" || d.status === "final"));
  if (!docs.length) return new Response("Nothing ready to download yet", { status: 404 });

  const zip = new JSZip();
  const used = new Set<string>();
  for (const d of docs) {
    const doc = { title: d.title, bodyMarkdown: d.bodyMarkdown!, brief: (d.brief as Brief | null) ?? null };
    // Unique folder per article so same-titled pieces don't collide.
    let folder = slugify(d.title ?? "document");
    let n = 2;
    while (used.has(folder)) folder = `${slugify(d.title ?? "document")}-${n++}`;
    used.add(folder);

    const [md, html, docx] = await Promise.all([
      renderExport(doc, "markdown"), renderExport(doc, "html"), renderExport(doc, "docx"),
    ]);
    zip.file(`${folder}/${folder}.md`, md.body);
    zip.file(`${folder}/${folder}.html`, html.body);
    zip.file(`${folder}/${folder}.docx`, docx.body);
  }

  const buf = await zip.generateAsync({ type: "uint8array" });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Blob([buf as BlobPart]), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="mavrix-batch-${stamp}.zip"`,
    },
  });
}
