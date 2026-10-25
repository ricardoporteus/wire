"use client";

import Link from "next/link";
import { usePaging, PagerBar } from "@/components/Pager";
import { TRIGGER_LABEL, RUN_STATUS_BADGE, RUN_STATUS_LABEL, formatDateTime, formatDuration } from "@/lib/seo-labels";

type Run = {
  id: string; trigger: string; status: string;
  createdAt: string; startedAt: string | null; completedAt: string | null;
};

export function RunHistory({ runs, selectedId }: { runs: Run[]; selectedId: string }) {
  const { page, setPage, pageSize, setPageSize, pageCount, from, to } = usePaging(runs.length, "runs");
  const rows = runs.slice(from, to);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-body-sm">
          <thead>
            <tr className="border-b border-line text-caption uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 text-left font-medium">Date</th>
              <th className="py-2 pr-4 text-left font-medium">Trigger</th>
              <th className="py-2 pr-4 text-left font-medium">Status</th>
              <th className="py-2 pr-4 text-left font-medium">Duration</th>
              <th className="py-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <tr key={r.id} className={`border-b border-line ${isSelected ? "bg-accent-tint" : ""}`}>
                  <td className="py-2.5 pr-4 text-ink-green">{formatDateTime(r.createdAt)}</td>
                  <td className="py-2.5 pr-4 text-muted">{TRIGGER_LABEL[r.trigger] ?? r.trigger}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`badge ${RUN_STATUS_BADGE(r.status)}`}>{RUN_STATUS_LABEL[r.status] ?? r.status}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-muted">{formatDuration(r.startedAt, r.completedAt)}</td>
                  <td className="py-2.5 text-right">
                    {isSelected ? (
                      <span className="text-caption text-muted">Viewing</span>
                    ) : (
                      <Link href={`/audit?run=${r.id}`} className="text-caption text-accent-ink hover:underline">View report</Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PagerBar page={page} count={pageCount} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} />
    </>
  );
}
