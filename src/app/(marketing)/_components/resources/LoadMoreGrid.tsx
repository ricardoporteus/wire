"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import type { ArticleCard, CategorySlug } from "@/content/resources/types";

/**
 * The "media platform" continuous feed. Renders an initial server-provided page,
 * then lazy-loads more from /api/resources as the sentinel scrolls into view.
 * A visible "Load more" button is always present as a no-JS / fallback path.
 */
export function LoadMoreGrid({
  initial,
  nextOffset,
  category,
}: {
  initial: ArticleCard[];
  nextOffset: number | null;
  category?: CategorySlug;
}) {
  const [cards, setCards] = useState<ArticleCard[]>(initial);
  const [offset, setOffset] = useState<number | null>(nextOffset);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || offset == null) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(offset), limit: "6" });
      if (category) params.set("category", category);
      const res = await fetch(`/api/resources?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { cards: ArticleCard[]; nextOffset: number | null };
      setCards((c) => [...c, ...data.cards]);
      setOffset(data.nextOffset);
    } catch {
      // leave the button so the reader can retry manually
    } finally {
      setLoading(false);
    }
  }, [loading, offset, category]);

  // Auto-load when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || offset == null) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, offset]);

  return (
    <>
      <div className="rh-grid">
        {cards.map((c) => <ResourceCard key={`${c.category}/${c.slug}`} card={c} />)}
      </div>
      <div ref={sentinel} className="rh-sentinel" aria-hidden="true" />
      <div className="rh-more">
        {offset != null ? (
          <button type="button" className="btn btn-ghost" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more articles"}
          </button>
        ) : (
          <span className="rh-end">You&rsquo;re all caught up. New pieces ship every week.</span>
        )}
      </div>
    </>
  );
}
