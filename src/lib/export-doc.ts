/**
 * Deterministic document rendering for exports — markdown / HTML / docx. No AI,
 * no credits: a straight render of a finished draft with its content brief / SEO
 * sheet appended at the foot. Shared by the single-article export route and the
 * bulk-batch zip download so both produce identical files.
 */
import { marked } from "marked";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export type ExportFormat = "markdown" | "html" | "docx";

/** The content brief stored on a finished piece — wider than the schema's base type. */
export type Brief = {
  wordCount?: number;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  targetAeoQuestion?: string;
  metaDescription?: string;
  altTexts?: string[];
  valuesReflected?: string[];
  terminologyCheckPassed?: boolean;
  voiceChecksPassed?: boolean;
  terminologyViolations?: { found: string; useInstead: string }[];
  factCheck?: {
    checkedCount: number;
    removed: { claim: string; type: string; verdict: string; note?: string }[];
    flagged: { claim: string; type: string; note?: string }[];
  };
};

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** A filesystem-safe slug for filenames, derived from the title. */
export function slugify(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document"
  );
}

/**
 * Render the content brief / SEO sheet as markdown so every export carries it at
 * the foot of the article in one document.
 */
export function briefMarkdown(brief: Brief): string {
  const L: string[] = ["---", "", "## Content brief", ""];
  if (typeof brief.wordCount === "number") L.push(`**Word count:** ${brief.wordCount}`, "");
  if (brief.primaryKeyword) L.push(`**Primary keyword:** ${brief.primaryKeyword}`, "");
  if (brief.secondaryKeywords?.length) L.push(`**Secondary keywords:** ${brief.secondaryKeywords.join(" · ")}`, "");
  if (brief.targetAeoQuestion) L.push(`**AEO question:** ${brief.targetAeoQuestion}`, "");
  if (brief.metaDescription) L.push(`**Meta description:** ${brief.metaDescription}`, "");
  if (brief.altTexts?.length) {
    L.push("**Alt text:**", "");
    for (const a of brief.altTexts) L.push(`- ${a}`);
    L.push("");
  }
  if (brief.valuesReflected?.length) L.push(`**Values reflected:** ${brief.valuesReflected.join(", ")}`, "");
  if (typeof brief.terminologyCheckPassed === "boolean") {
    if (brief.terminologyCheckPassed) {
      L.push("**Terminology check:** clean", "");
    } else {
      L.push(`**Terminology check:** ${brief.terminologyViolations?.length ?? 0} to fix`, "");
      for (const v of brief.terminologyViolations ?? []) L.push(`- “${v.found}” → use “${v.useInstead}”`);
      L.push("");
    }
  }
  if (typeof brief.voiceChecksPassed === "boolean") {
    L.push(`**Voice check:** ${brief.voiceChecksPassed ? "passed" : "needs review"}`, "");
  }
  if (brief.factCheck) {
    const { checkedCount, removed, flagged } = brief.factCheck;
    L.push(`**Fact check:** ${checkedCount} claim${checkedCount === 1 ? "" : "s"} checked`, "");
    if (removed?.length) {
      L.push("_Removed:_", "");
      for (const r of removed) L.push(`- ${r.claim}${r.note ? ` — ${r.note}` : ""}`);
      L.push("");
    }
    if (flagged?.length) {
      L.push("_Flagged for review:_", "");
      for (const f of flagged) L.push(`- ${f.claim}${f.note ? ` — ${f.note}` : ""}`);
      L.push("");
    }
  }
  return L.join("\n").trimEnd();
}

/** Article body + brief as one markdown string. */
function combinedMarkdown(bodyMarkdown: string, brief: Brief | null): string {
  const bm = brief ? briefMarkdown(brief) : "";
  return bm ? `${bodyMarkdown}\n\n${bm}` : bodyMarkdown;
}

function inlineRuns(text: string): TextRun[] {
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

export type RenderedExport = { body: string | Uint8Array; contentType: string; ext: string };

/** Render one document to the requested format, brief appended. */
export async function renderExport(
  doc: { title: string | null; bodyMarkdown: string; brief: Brief | null },
  format: ExportFormat,
): Promise<RenderedExport> {
  const title = doc.title ?? "mavrix-document";
  const body = combinedMarkdown(doc.bodyMarkdown, doc.brief);

  if (format === "markdown") {
    return { body: `# ${title}\n\n${body}`, contentType: "text/markdown; charset=utf-8", ext: "md" };
  }
  if (format === "html") {
    const htmlBody = await marked.parse(body);
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>body{max-width:720px;margin:3rem auto;padding:0 1.25rem;font:16px/1.7 -apple-system,Inter,system-ui,sans-serif;color:#0A0915}h1,h2,h3{line-height:1.25;color:#102D23}a{color:#0099FF}</style>
</head><body><h1>${esc(title)}</h1>${htmlBody}</body></html>`;
    return { body: html, contentType: "text/html; charset=utf-8", ext: "html" };
  }
  // docx
  const buf = await Packer.toBuffer(toDocx(title, body));
  return {
    body: new Uint8Array(buf),
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  };
}
