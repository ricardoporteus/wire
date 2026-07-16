"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reconcileSubscriptionCredits } from "./actions";

/**
 * Manual fallback for the auto-reconcile on page load: Clerk's session claim can
 * lag a second or two behind a fresh checkout, so this lets the user re-check
 * without hunting for a reload. No-op once the plan's credits are already synced.
 */
export function BillingSync() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const sync = () =>
    start(async () => {
      const r = await reconcileSubscriptionCredits();
      setMsg(
        r.granted
          ? `Synced your ${r.plan} plan — credits added.`
          : r.plan
            ? `You're on ${r.plan}; credits are already up to date.`
            : "No active paid plan found yet. If you just paid, give it a few seconds and try again.",
      );
      router.refresh();
    });

  return (
    <div className="mt-4">
      <button className="btn-ghost" disabled={pending} onClick={sync}>
        {pending ? "Checking…" : "↻ Just paid? Sync my credits"}
      </button>
      {msg && <p className="mt-2 text-caption text-muted">{msg}</p>}
    </div>
  );
}
