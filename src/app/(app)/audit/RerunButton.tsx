"use client";

/**
 * Re-run trigger for the audit page. Reuses the dashboard's server action, so
 * the credit check, the rate limits and the "don't stack runs" guard are all the
 * same code path rather than a second implementation that could drift.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rerunIntelligence } from "../dashboard/actions";
import { CREDIT_COSTS } from "@/lib/credit-costs";

const MESSAGES: Record<string, string> = {
  insufficient_credits: `Not enough credits. A run costs ${CREDIT_COSTS.intelligence_run}.`,
  already_running: "A run is already going. Watch it on the dashboard.",
  not_ready: "Finish onboarding first.",
  rate_limited: "Too many runs recently. Try again shortly.",
};

export function RerunButton({ running }: { running: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await rerunIntelligence();
      if (res.ok) {
        // The run streams on the dashboard, which already has the live feed.
        router.push("/dashboard");
      } else {
        setError(MESSAGES[res.error] ?? "Could not start a run.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || running}
        className="btn-accent disabled:opacity-50"
      >
        {running ? "Run in progress…" : pending ? "Starting…" : "Run audit now"}
      </button>
      <p className="mt-2 text-caption text-muted">{CREDIT_COSTS.intelligence_run} credits</p>
      {error && <p className="mt-1 text-caption text-[#B42324]">{error}</p>}
    </div>
  );
}
