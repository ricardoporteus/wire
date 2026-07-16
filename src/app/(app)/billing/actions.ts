"use server";

/**
 * Subscription → credits reconciliation.
 *
 * The Clerk webhook is the primary grant path in production, but it can't reach
 * localhost in dev (and can be missed in prod). This reads the org's *current*
 * plan straight from the Clerk session (`has({ plan })`) and grants that plan's
 * credits if the DB hasn't recorded them yet. Idempotent with the webhook: both
 * use `organizations.planSlug` as the sync marker and grant inside a row-locked
 * transaction, so a plan is only ever granted once per change.
 */

import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, usageLedger } from "@/db/schema";
import { PLAN_GRANTS } from "@/lib/credits";

const PAID_PLANS = ["scale", "growth", "launch"] as const;

export async function reconcileSubscriptionCredits(): Promise<{
  ok: boolean; plan: string | null; granted: boolean;
}> {
  const { orgId: clerkOrgId, has } = await auth();
  if (!clerkOrgId || !has) return { ok: false, plan: null, granted: false };

  // Highest plan the active org currently holds, per Clerk.
  const detected = PAID_PLANS.find((p) => has({ plan: p })) ?? null;
  if (!detected) return { ok: true, plan: null, granted: false };

  const granted = await db.transaction(async (tx) => {
    const [org] = await tx.select().from(organizations)
      .where(eq(organizations.clerkOrgId, clerkOrgId)).for("update");
    if (!org || org.planSlug === detected) return false; // already synced for this plan
    await tx.insert(usageLedger).values({
      orgId: org.id, reason: "plan_grant", credits: PLAN_GRANTS[detected],
      refType: "run", refId: org.id,
    });
    await tx.update(organizations).set({
      planSlug: detected,
      creditsBalance: sql`${organizations.creditsBalance} + ${PLAN_GRANTS[detected]}`,
    }).where(eq(organizations.id, org.id));
    return true;
  });

  return { ok: true, plan: detected, granted };
}
