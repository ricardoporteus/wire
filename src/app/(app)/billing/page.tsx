/**
 * Billing — Clerk Billing <PricingTable /> (org plans) plus the current plan and
 * credit balance. Plans/prices are configured in the Clerk dashboard; Stripe
 * processes payments underneath. Credits are ours (the usage ledger).
 */
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { BillingTable } from "./BillingTable";

export default async function BillingPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return null;
  const org = await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <span className="eyebrow">Billing</span>
      <h1 className="mt-4 text-h2 text-ink-green">Plans &amp; credits</h1>
      <p className="mt-2 text-muted">
        All four tools are in every plan — tiers differ by generation credits, Brand Brains, and seats.
      </p>

      {org && (
        <div className="card mt-6 flex items-center justify-between">
          <div>
            <p className="text-caption text-muted">Current plan</p>
            <p className="text-h5 capitalize text-ink-green">{org.planSlug}</p>
          </div>
          <div className="text-right">
            <p className="text-caption text-muted">Credit balance</p>
            <p className="text-h5 text-ink-green">{org.creditsBalance}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <BillingTable />
      </div>

      <p className="mt-6 text-caption text-muted">
        Top-ups: $99 per 300 credits. Annual billing gives two months free. A long-form article is ~20 credits,
        a repurpose pack ~5, a monthly intelligence run ~100.
      </p>
    </main>
  );
}
