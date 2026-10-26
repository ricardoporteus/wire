import Link from "next/link";
import { Avatar } from "../Avatars";
// Import from the lightweight meta/types modules (not the barrel) so this file,
// when pulled into the client grid, never bundles the full article corpus.
import { AUTHORS, CATEGORY_BY_SLUG, TYPE_LABEL } from "@/content/resources/meta";
import type { CategorySlug, ContentType } from "@/content/resources/types";
import type { SpecialistId } from "../Avatars";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic date formatting, so server and client render identically. */
export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Small category chip, color-coded by pillar, links to the category index. */
export function CategoryChip({ slug, link = true }: { slug: CategorySlug; link?: boolean }) {
  const c = CATEGORY_BY_SLUG[slug];
  const inner = <span className={`rh-cat rh-acc-${c.accent}`}>{c.name}</span>;
  return link ? <Link href={`/resources/${slug}`} className="rh-catlink">{inner}</Link> : inner;
}

/** Content-type badge (Tutorial, How-to, etc.). */
export function TypeBadge({ type }: { type: ContentType }) {
  return <span className="rh-type">{TYPE_LABEL[type]}</span>;
}

/** Author byline with avatar; `full` adds the role and a dot-separated meta row. */
export function Byline({ author, date, minutes, size = "sm" }: {
  author: SpecialistId; date?: string; minutes?: number; size?: "sm" | "lg";
}) {
  const a = AUTHORS[author];
  return (
    <span className={`rh-by rh-by-${size}`}>
      <span className="rh-ava"><Avatar id={a.id} /></span>
      <span className="rh-bytext">
        <span className="rh-byname">{a.name}</span>
        <span className="rh-bymeta">
          {size === "lg" && <>{a.role}</>}
          {date && <>{size === "lg" ? " · " : ""}{fmtDate(date)}</>}
          {minutes != null && <> · {minutes} min read</>}
        </span>
      </span>
    </span>
  );
}
