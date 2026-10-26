import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../_components/SiteNav";
import { SiteFooter } from "../_components/SiteFooter";
import { FeaturePiece } from "../_components/resources/FeaturePiece";
import { LoadMoreGrid } from "../_components/resources/LoadMoreGrid";
import { CATEGORIES, getFeatured, getCards, getCategoryCards } from "@/content/resources";

export const metadata: Metadata = {
  title: "Resources — Mavrix | AI Search, SEO & Content Playbooks",
  description:
    "The Mavrix library: deep dives, how-to guides and playbooks on answer engine optimization, SEO and compounding content. Built to help founders get found on Google and quoted by AI.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "The Mavrix Library — AI Search, SEO & Content Playbooks",
    description: "Deep dives and playbooks on AEO, SEO and compounding content. New pieces every week.",
    url: "/resources",
    type: "website",
  },
};

export default async function ResourcesHub() {
  const [featured, grid, ...railCards] = await Promise.all([
    getFeatured(),
    getCards({ limit: 6, excludeFeatured: true }),
    ...CATEGORIES.map((c) => getCategoryCards(c.slug)),
  ]);

  return (
    <>
      <SiteNav />

      <header className="rh-hero">
        <div className="wrap">
          <span className="eyebrow">The Mavrix Library</span>
          <h1 className="rh-hero-ttl">Get found on Google. Get quoted by AI.</h1>
          <p className="rh-hero-lead">
            Deep dives, how-to guides and playbooks on answer engine optimization, SEO and compounding content.
            The same workflow Mavrix runs for your brand, shared in the open. New pieces every week.
          </p>
          <nav className="rh-hero-cats" aria-label="Categories">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/resources/${c.slug}`} className={`rh-hero-cat rh-acc-${c.accent}`}>
                <b>{c.name}</b><span>{c.tagline}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="wrap rh-main">
        <FeaturePiece article={featured} />

        {/* Category rails — the three pillars with their latest pieces */}
        <section className="rh-rails" aria-label="Browse by category">
          {CATEGORIES.map((c, i) => {
            const cards = railCards[i].slice(0, 3);
            return (
              <div key={c.slug} className="rh-rail">
                <div className="rh-rail-head">
                  <div>
                    <span className={`rh-cat rh-acc-${c.accent}`}>{c.name}</span>
                    <p className="rh-rail-tag">{c.description}</p>
                  </div>
                  <Link href={`/resources/${c.slug}`} className="rh-rail-all">View all →</Link>
                </div>
                <ul className="rh-rail-list">
                  {cards.map((card) => (
                    <li key={card.slug}>
                      <Link href={`/resources/${card.category}/${card.slug}`}>
                        <span className="rh-rail-ttl">{card.title}</span>
                        <span className="rh-rail-meta">{card.readingMinutes} min read</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        {/* Continuous feed */}
        <section className="rh-latest" aria-label="Latest articles">
          <div className="rh-latest-head">
            <h2>Latest from the library</h2>
            <p className="muted">Fresh playbooks as they ship.</p>
          </div>
          <LoadMoreGrid initial={grid.cards} nextOffset={grid.nextOffset} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
