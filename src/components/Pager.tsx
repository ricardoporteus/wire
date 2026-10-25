"use client";

/**
 * Shared pagination for results tables: a "per page" dropdown (10 / 20 / 50 /
 * All) plus numbered pages. `usePaging` owns the state and the row window.
 */
import { useEffect, useState } from "react";

export type PageSize = 10 | 20 | 50 | "all";

export function usePaging(total: number, resetKey: unknown = "") {
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [page, setPage] = useState(1);
  // Back to page 1 whenever the filter set or the page size changes.
  useEffect(() => { setPage(1); }, [resetKey, pageSize]);

  const size = pageSize === "all" ? Math.max(total, 1) : pageSize;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, pageCount);
  const from = pageSize === "all" ? 0 : (safePage - 1) * size;
  const to = pageSize === "all" ? total : from + size;

  return { page: safePage, setPage, pageSize, setPageSize, pageCount, from, to };
}

function windowPages(page: number, count: number): (number | "ellipsis")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) out.push("ellipsis");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < count - 1) out.push("ellipsis");
  out.push(count);
  return out;
}

export function PagerBar({
  page, count, onPage, pageSize, onPageSize,
}: {
  page: number;
  count: number;
  onPage: (p: number) => void;
  pageSize: PageSize;
  onPageSize: (s: PageSize) => void;
}) {
  const base = "min-w-9 rounded-md border px-3 py-1.5 text-caption transition-colors disabled:cursor-default disabled:opacity-40";
  const off = "border-line text-muted hover:border-ink-green hover:text-ink-green";
  const on = "border-accent bg-accent font-semibold text-ink-green";

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
      <label className="flex items-center gap-2 text-caption text-muted">
        Show
        <select
          className="input w-auto"
          value={String(pageSize)}
          onChange={(e) => onPageSize(e.target.value === "all" ? "all" : (Number(e.target.value) as PageSize))}
          aria-label="Rows per page"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="all">All</option>
        </select>
        per page
      </label>

      {count > 1 && (
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Pagination">
          <button className={`${base} ${off}`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">‹</button>
          {windowPages(page, count).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="px-1 text-muted">…</span>
            ) : (
              <button
                key={p}
                className={`${base} ${p === page ? on : off}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            ),
          )}
          <button className={`${base} ${off}`} disabled={page >= count} onClick={() => onPage(page + 1)} aria-label="Next page">›</button>
        </nav>
      )}
    </div>
  );
}
