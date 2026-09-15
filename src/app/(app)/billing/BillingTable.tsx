"use client";

import { Component, type ReactNode } from "react";
import { PricingTable } from "@clerk/nextjs";

/**
 * <PricingTable/> throws until Clerk Billing (Beta) is enabled and plans are
 * configured in the Clerk dashboard. Contain that so the page degrades to a
 * clear "set this up" message instead of a crash.
 */
class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function SetupPending() {
  return (
    <div className="card--lg card">
      <span className="badge badge--queued">Billing not enabled yet</span>
      <p className="mt-3 text-body-sm text-ink">
        Turn on Clerk Billing (Beta) in your Clerk dashboard and add the <strong>launch</strong>,{" "}
        <strong>growth</strong>, and <strong>scale</strong> plans with their feature slugs. The live pricing
        table will render here once billing is enabled — Stripe processes payments underneath.
      </p>
    </div>
  );
}

export function BillingTable() {
  // Mavrix is org-scoped (one Clerk Organization = one customer), so show the
  // Organization plans (launch/growth/scale) for the active org, not user plans.
  return (
    <Boundary fallback={<SetupPending />}>
      <PricingTable for="organization" />
    </Boundary>
  );
}
