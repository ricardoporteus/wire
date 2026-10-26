import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "../../_components/SiteNav";
import { SiteFooter } from "../../_components/SiteFooter";
import { LoadMoreGrid } from "../../_components/resources/LoadMoreGrid";
import { CATEGORIES, CATEGORY_BY_SLUG, getCards } from "@/content/resources";
import type { CategorySlug } from "@/content/resources/types";

const SLUGS = new Set(CATEGORIES.map((c) => c.slug));
const isCategory = (s: string): s is CategorySlug => SLUGS.has(s as CategorySlug);

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const c = CATEGORY_BY_SLUG[category];
  return {
    title: `${c.name} — Mavrix Resources`,
    description: c.description,
    alternates: { canonical: `/resources/${c.slug}` },
    openGraph: { title: `${c.name} — Mavrix Resources`, description: c.description, url: `/resources/${c.slug}`, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const c = CATEGORY_BY_SLUG[category];
  const { cards, nextOffset } = await getCards({ category, limit: 9 });

  return (
    <>
      <SiteNav />
      <header className="rh-cathero">
        <div className="wrap">
          <nav className="rh-crumb" aria-label="Breadcrumb">
            <Link href="/resources">Resources</Link><span aria-hidden="true">›</span>
            <span className="rh-crumb-cur">{c.name}</span>
          </nav>
          <span className={`rh-cat rh-acc-${c.accent}`}>{c.tagline}</span>
          <h1 className="rh-cathero-ttl">{c.name}</h1>
          <p className="rh-cathero-lead">{c.description}</p>
          <div className="rh-cathero-nav">
            {CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
              <Link key={x.slug} href={`/resources/${x.slug}`} className="rh-cathero-other">{x.name} →</Link>
            ))}
          </div>
        </div>
      </header>

      <main className="wrap rh-main">
        <LoadMoreGrid initial={cards} nextOffset={nextOffset} category={category} />
      </main>

      <SiteFooter />
    </>
  );
}
