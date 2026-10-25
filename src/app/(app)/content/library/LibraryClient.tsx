"use client";

import { useState } from "react";

const LABEL: Record<string, string> = {
  linkedin_article: "LinkedIn article", linkedin_post: "LinkedIn post", x_caption: "X post",
  instagram_caption: "Instagram caption", facebook_caption: "Facebook caption", newsletter_block: "Newsletter block",
  markdown: "Markdown", html: "HTML", docx: "Word (.docx)",
};

type Exp = { kind: string; content: string | null };
type Group = { docId: string; title: string; exports: Exp[] };

export function LibraryClient({ groups }: { groups: Group[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard blocked — no-op */ }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <span className="eyebrow">Content · Library</span>
      <h1 className="mt-4 text-h2 text-ink-green">Library</h1>
      <p className="mt-2 text-body-sm text-muted">Every repurpose pack and export you&apos;ve made, by piece.</p>
      <a href="/content" className="mt-3 inline-block text-caption font-semibold text-accent-strong">← Back to Content</a>

      {groups.length === 0 ? (
        <p className="mt-10 text-muted">
          No exports yet. Open a finished piece to create a repurpose pack, or download it as Markdown, HTML or Word.
        </p>
      ) : (
        <div className="mt-8 grid gap-6">
          {groups.map((g) => (
            <section key={g.docId} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <a href={`/write/${g.docId}`} className="text-h5 text-ink-green hover:underline">{g.title}</a>
                <div className="flex flex-wrap items-center gap-3 text-caption font-semibold text-accent-strong">
                  <a href={`/write/${g.docId}/export?format=markdown`}>Markdown</a>
                  <a href={`/write/${g.docId}/export?format=html`}>HTML</a>
                  <a href={`/write/${g.docId}/export?format=docx`}>Word</a>
                </div>
              </div>
              <ul className="mt-4 grid gap-3">
                {g.exports.map((e, i) => {
                  const key = `${g.docId}-${i}`;
                  return (
                    <li key={key} className="flex items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                      <span className="badge badge--draft mt-0.5 flex-none">{LABEL[e.kind] ?? e.kind}</span>
                      <p className="line-clamp-3 min-w-0 flex-1 whitespace-pre-wrap text-body-sm text-ink">{e.content}</p>
                      {e.content && (
                        <button
                          className="flex-none text-caption font-semibold text-accent-strong"
                          onClick={() => copy(key, e.content!)}
                        >
                          {copied === key ? "Copied ✓" : "Copy"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
