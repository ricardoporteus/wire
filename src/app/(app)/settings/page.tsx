/**
 * Settings — team, account, and plans & billing (folded in from the old
 * /billing page). The Brand Brain lives in its own /brand area.
 */
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { OrganizationProfile } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { BillingTable } from "../billing/BillingTable";
import { BillingSync } from "../billing/BillingSync";
import { reconcileSubscriptionCredits } from "../billing/actions";

export default async function SettingsPage() {
  const { orgId: clerkOrgId } = await auth();
  // Grant a just-purchased plan's credits even if the Clerk webhook didn't land
  // — idempotent, so returning here after checkout tops up the balance.
  if (clerkOrgId) await reconcileSubscriptionCredits();
  const org = clerkOrgId
    ? await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) })
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">Settings</span>
      <h1 className="mt-4 text-h2 text-ink-green">Settings</h1>
      <p className="mt-2 text-body-sm text-muted">
        Your team, plan and account. Your brand voice and approved facts live in{" "}
        <Link href="/brand" className="font-semibold text-accent-strong">Brand / ICP</Link>.
      </p>

      {/* Team */}
      <section className="mt-10">
        <h2 className="text-h4 text-ink-green">Team</h2>
        <p className="mt-1 text-body-sm text-muted">Invite teammates and manage your workspace.</p>
        <div className="mt-4"><OrganizationProfile routing="hash" /></div>
      </section>

      {/* Plans & billing */}
      <section className="mt-14">
        <h2 className="text-h4 text-ink-green">Plans &amp; billing</h2>
        <p className="mt-1 text-body-sm text-muted">
          All four agents are in every plan — tiers differ by generation credits, Brand Brains, and seats.
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

        <BillingSync />

        <div className="mt-8"><BillingTable /></div>

        <p className="mt-6 text-caption text-muted">
          Top-ups: $99 per 300 credits. Annual billing gives two months free. A long-form article is ~20 credits,
          a repurpose pack ~5, a monthly intelligence run ~100.
        </p>
      </section>
    </main>
  );
}
