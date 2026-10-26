import Link from "next/link";
import { CategoryChip, TypeBadge, Byline } from "./Bits";
import type { Article } from "@/content/resources/types";

/** The hub's lead story: a large, dark editorial hero card. */
export function FeaturePiece({ article }: { article: Article }) {
  const href = `/resources/${article.category}/${article.slug}`;
  return (
    <section className="rh-feature">
      <div className="rh-feat-tags">
        <span className="rh-feat-kicker">Featured</span>
        <CategoryChip slug={article.category} />
        <TypeBadge type={article.type} />
      </div>
      <Link href={href} className="rh-feat-link">
        <h2 className="rh-feat-ttl">{article.title}</h2>
      </Link>
      <p className="rh-feat-dek">{article.excerpt}</p>
      <div className="rh-feat-foot">
        <Byline author={article.author} date={article.datePublished} minutes={article.readingMinutes} size="lg" />
        <Link href={href} className="btn btn-lime rh-feat-cta">Read the guide →</Link>
      </div>
    </section>
  );
}
