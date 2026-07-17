import Link from "next/link";

/**
 * Public legal pages (Terms, Privacy, AI disclosure). Outside the (app) route
 * group so they are reachable without auth — prospects and their counsel read
 * these before signing. Starting-point templates, not legal advice: the banner
 * says so, and every page carries the same disclaimer.
 */
const DOCS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/ai-disclosure", label: "AI-Content Disclosure" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-h5 font-semibold text-ink-green">Wire</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
          {DOCS.map((d) => (
            <Link key={d.href} href={d.href} className="text-muted hover:text-ink-green">{d.label}</Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 rounded-md border border-line bg-accent-tint px-4 py-3 text-caption text-ink">
        <strong>Template, not legal advice.</strong> These documents are a good-faith starting point tailored to how
        Wire works. Have a qualified attorney review and adapt them for your jurisdiction and business before you rely
        on them or take paying customers.
      </div>

      {children}

      <footer className="mt-16 border-t border-line pt-6 text-caption text-muted">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {DOCS.map((d) => (
            <Link key={d.href} href={d.href} className="hover:text-ink-green">{d.label}</Link>
          ))}
        </nav>
        <p className="mt-3">© {"[Wire, Inc.]"} — the content engine for CMOs.</p>
      </footer>

      <style>{`
        .legal h1 { font-family: var(--font-display, inherit); }
        .legal h2 { font-size: 1.35rem; font-weight: 600; color: var(--color-ink-green, #102D23); margin-top: 2.25rem; margin-bottom: .5rem; }
        .legal h3 { font-size: 1.05rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: .35rem; }
        .legal p, .legal li { color: var(--color-ink, #1a1a1a); line-height: 1.7; }
        .legal p { margin-top: .75rem; }
        .legal ul { margin-top: .6rem; padding-left: 1.25rem; list-style: disc; }
        .legal li { margin-top: .3rem; }
        .legal a { color: var(--color-accent-strong, #2563eb); text-decoration: underline; }
        .legal strong { color: var(--color-ink-green, #102D23); }
      `}</style>
    </div>
  );
}
