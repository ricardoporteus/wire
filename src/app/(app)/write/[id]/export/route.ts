/**
 * Deterministic exports — markdown / HTML / docx. No AI, no credits: a straight
 * render of the finished draft. Org-scoped; returns the file as a download.
 */
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { marked } from "marked";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { db } from "@/lib/db";
import { documents, brandBrains, organizations } from "@/db/schema";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function inlineRuns(text: string): TextRun[] {
  // Minimal inline markdown: **bold** segments; everything else plain.
  return text.split(/\*\*/).map((part, i) => new TextRun({ text: part, bold: i % 2 === 1 }));
}

function toDocx(title: string, md: string): Document {
  const children: Paragraph[] = [new Paragraph({ text: title, heading: HeadingLevel.TITLE })];
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) { children.push(new Paragraph({})); continue; }
    if (line.startsWith("### ")) children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
    else if (line.startsWith("## ")) children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
    else if (line.startsWith("# ")) children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
    else if (/^[-*]\s+/.test(line)) children.push(new Paragraph({ children: inlineRuns(line.replace(/^[-*]\s+/, "")), bullet: { level: 0 } }));
    else children.push(new Paragraph({ children: inlineRuns(line) }));
  }
  return new Document({ sections: [{ children }] });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "markdown";

  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return new Response("Unauthorized", { status: 401 });

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) });
  if (!doc?.bodyMarkdown) return new Response("Not found", { status: 404 });
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, doc.brainId) });
  const org = brain && (await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) }));
  if (!org || org.clerkOrgId !== clerkOrgId) return new Response("Forbidden", { status: 403 });

  const title = doc.title ?? "wire-document";
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";
  const attach = (ext: string) => `attachment; filename="${slug}.${ext}"`;

  if (format === "markdown") {
    return new Response(`# ${title}\n\n${doc.bodyMarkdown}`, {
      headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": attach("md") },
    });
  }

  if (format === "html") {
    const body = await marked.parse(doc.bodyMarkdown);
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>body{max-width:720px;margin:3rem auto;padding:0 1.25rem;font:16px/1.7 -apple-system,Inter,system-ui,sans-serif;color:#0A0915}h1,h2,h3{line-height:1.25;color:#102D23}a{color:#0099FF}</style>
</head><body><h1>${esc(title)}</h1>${body}</body></html>`;
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8", "content-disposition": attach("html") },
    });
  }

  if (format === "docx") {
    const buf = await Packer.toBuffer(toDocx(title, doc.bodyMarkdown));
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": attach("docx"),
      },
    });
  }

  return new Response("Unsupported format", { status: 400 });
}
