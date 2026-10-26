import Link from "next/link";
import { Avatar } from "../Avatars";
import { CategoryChip, TypeBadge, Byline, fmtDate } from "./Bits";
import { ResourceCard } from "./ResourceCard";
import { AUTHORS, CATEGORY_BY_SLUG } from "@/content/resources/meta";
import type { Article, ArticleCard, Block } from "@/content/resources/types";

const SITE = "https://mavrix.agency";

/** Renders one authored block. `p`/`callout` hold trusted, hand-authored HTML. */
function Blk({ b }: { b: Block }) {
  switch (b.k) {
    case "p": return <p dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "h2": return <h2 id={b.id}>{b.text}</h2>;
    case "h3": return <h3 id={b.id}>{b.text}</h3>;
    case "ul": return <ul>{b.items.map((i, n) => <li key={n} dangerouslySetInnerHTML={{ __html: i }} />)}</ul>;
    case "ol": return <ol>{b.items.map((i, n) => <li key={n} dangerouslySetInnerHTML={{ __html: i }} />)}</ol>;
    case "quote": return <blockquote><p>{b.text}</p>{b.cite && <cite>{b.cite}</cite>}</blockquote>;
    case "callout": return (
      <aside className="rh-callout">{b.title && <b>{b.title}</b>}<span dangerouslySetInnerHTML={{ __html: b.html }} /></aside>
    );
    case "table": return (
      <div className="rh-tablewrap"><table className="rh-table">
        <thead><tr>{b.head.map((h, n) => <th key={n}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, n) => <tr key={n}>{r.map((c, m) => <td key={m}>{c}</td>)}</tr>)}</tbody>
      </table></div>
    );
  }
}

export function ArticleView({ article, related }: { article: Article; related: ArticleCard[] }) {
  const cat = CATEGORY_BY_SLUG[article.category];
  const author = AUTHORS[article.author];
  const toc = article.body.filter((b): b is Extract<Block, { k: "h2" }> => b.k === "h2");
  const canonical = `${SITE}/resources/${article.category}/${article.slug}`;

  // --- Structured data: Article + BreadcrumbList (+ FAQPage when present) ---
  const graph: object[] = [
    {
      "@type": "Article",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      author: { "@type": "Organization", name: `Mavrix · ${author.name}` },
      publisher: { "@type": "Organization", name: "Mavrix", url: SITE },
      mainEntityOfPage: canonical,
      articleSection: cat.name,
      keywords: article.tags.join(", "),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Resources", item: `${SITE}/resources` },
        { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE}/resources/${article.category}` },
        { "@type": "ListItem", position: 3, name: article.title, item: canonical },
      ],
    },
  ];
  if (article.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: article.faq.map((f) => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <article className="rh-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="wrap rh-art-wrap">
        <nav className="rh-crumb" aria-label="Breadcrumb">
          <Link href="/resources">Resources</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/resources/${article.category}`}>{cat.name}</Link>
          <span aria-hidden="true">›</span>
          <span className="rh-crumb-cur">{article.title}</span>
        </nav>

        <header className="rh-art-head">
          <div className="rh-art-tags"><CategoryChip slug={article.category} /><TypeBadge type={article.type} />{article.pillar && <span className="rh-pillar">Pillar</span>}</div>
          <h1 className="rh-art-ttl">{article.title}</h1>
          <p className="rh-art-dek">{article.excerpt}</p>
          <div className="rh-art-by">
            <Byline author={article.author} date={article.datePublished} minutes={article.readingMinutes} size="lg" />
            <span className="rh-art-kw">Target keyword: <b>{article.targetKeyword}</b></span>
          </div>
        </header>

        <div className="rh-art-body">
          {toc.length > 2 && (
            <aside className="rh-toc" aria-label="On this page">
              <span className="rh-toc-h">On this page</span>
              <ol>{toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
            </aside>
          )}

          <div className="rh-prose">
            {article.body.map((b, n) => <Blk key={n} b={b} />)}

            {article.faq?.length ? (
              <section className="rh-faq" aria-label="Frequently asked questions">
                <h2 id="faq">Frequently asked questions</h2>
                {article.faq.map((f, n) => (
                  <details key={n} {...(n === 0 ? { open: true } : {})}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </section>
            ) : null}

            <aside className="rh-authorcard">
              <span className="rh-ava lg"><Avatar id={author.id} /></span>
              <div>
                <div className="rh-ac-name">{author.name} <span>· {author.role}</span></div>
                <p>{author.bio}</p>
                <p className="rh-ac-note">Part of the Mavrix team. Last updated {fmtDate(article.dateModified)}.</p>
              </div>
            </aside>
          </div>
        </div>

        {related.length > 0 && (
          <section className="rh-related" aria-label="Related reading">
            <h2 className="rh-related-h">Keep reading</h2>
            <div className="rh-grid">{related.map((c) => <ResourceCard key={`${c.category}/${c.slug}`} card={c} size="sm" />)}</div>
          </section>
        )}

        <section className="rh-art-cta">
          <h2>Want this written for you, every week?</h2>
          <p>Mavrix measures the demand, checks Google&rsquo;s page one and AI answers, then writes each piece in this exact structure, held to your brand.</p>
          <div className="rh-cta-row">
            <Link className="btn btn-lime" href="/dashboard">Get my free plan</Link>
            <Link className="btn btn-ghost" href="/how-it-works">See how it works ›</Link>
          </div>
        </section>
      </div>
    </article>
  );
}
