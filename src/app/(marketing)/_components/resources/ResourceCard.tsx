import Link from "next/link";
import { CategoryChip, TypeBadge, Byline } from "./Bits";
import type { ArticleCard } from "@/content/resources/types";

/** One article card for the rails and the grid. `size` tunes the emphasis. */
export function ResourceCard({ card, size = "md" }: { card: ArticleCard; size?: "md" | "sm" }) {
  const href = `/resources/${card.category}/${card.slug}`;
  return (
    <article className={`rh-card rh-card-${size}`}>
      <Link href={href} className="rh-cardlink" aria-label={card.title}>
        <div className="rh-cardtop">
          <CategoryChip slug={card.category} link={false} />
          <TypeBadge type={card.type} />
          {card.pillar && <span className="rh-pillar">Pillar</span>}
        </div>
        <h3 className="rh-cardttl">{card.title}</h3>
        <p className="rh-cardex">{card.excerpt}</p>
      </Link>
      <div className="rh-cardfoot">
        <Byline author={card.author} date={card.datePublished} minutes={card.readingMinutes} />
      </div>
    </article>
  );
}
