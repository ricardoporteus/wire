import Link from "next/link";

/**
 * Performance (Ada) — the "is it working?" area. Placeholder tiles until the
 * Search Console connection ships (Tier 2); no fabricated numbers.
 */
const TILES = [
  { title: "Content performance", desc: "Clicks, impressions and average position for the pages Mavrix publishes." },
  { title: "Keyword movement", desc: "Which of your target keywords moved up or down, week over week." },
  { title: "Answer-box wins", desc: "Featured snippets and AI-answer citations your published pieces earn." },
];

export default function PerformancePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <span className="eyebrow">Performance · Ada</span>
      <h1 className="mt-4 text-h2 text-ink-green">Performance</h1>
      <p className="mt-2 text-body-sm text-muted">
        Is it working? Connect Google Search Console and Ada tracks how the content Mavrix wrote actually ranks and gets cited.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TILES.map((t) => (
          <section key={t.title} className="btile btile--soon">
            <div className="flex items-center justify-between">
              <span className="btile-label">{t.title}</span>
              <span className="text-micro text-muted">Soon</span>
            </div>
            <p className="mt-3 text-body-sm text-muted">{t.desc}</p>
          </section>
        ))}
      </div>

      <Link href="/settings" className="mt-6 inline-block text-caption font-semibold text-accent-strong">
        Connect Search Console →
      </Link>
    </main>
  );
}
