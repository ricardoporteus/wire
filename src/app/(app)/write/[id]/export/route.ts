/**
 * Deterministic exports — markdown / HTML / docx. No AI, no credits: a straight
 * render of the finished draft with its content brief appended. Org-scoped;
 * returns the file as a download. Rendering lives in @/lib/export-doc so the
 * bulk-batch zip produces identical files.
 */
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, brandBrains, organizations } from "@/db/schema";
import { renderExport, slugify, type Brief, type ExportFormat } from "@/lib/export-doc";

const FORMATS: Record<string, ExportFormat> = { markdown: "markdown", html: "html", docx: "docx" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = FORMATS[new URL(req.url).searchParams.get("format") ?? "markdown"];
  if (!format) return new Response("Unsupported format", { status: 400 });

  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return new Response("Unauthorized", { status: 401 });

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!doc?.bodyMarkdown) return new Response("Not found", { status: 404 });
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, doc.brainId) });
  const org = brain && (await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) }));
  if (!org || org.clerkOrgId !== clerkOrgId) return new Response("Forbidden", { status: 403 });

  const title = doc.title ?? "mavrix-document";
  const rendered = await renderExport(
    { title: doc.title, bodyMarkdown: doc.bodyMarkdown, brief: (doc.brief as Brief | null) ?? null },
    format,
  );
  const body: BodyInit = typeof rendered.body === "string" ? rendered.body : new Blob([rendered.body as BlobPart]);
  return new Response(body, {
    headers: {
      "content-type": rendered.contentType,
      "content-disposition": `attachment; filename="${slugify(title)}.${rendered.ext}"`,
    },
  });
}
