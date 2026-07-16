/**
 * Clerk webhook — the only writer of the organizations mirror.
 * Subscribe to: organization.created, organization.updated,
 * organizationMembership events as needed, and Clerk Billing
 * subscription events (subscriptionItem.active etc.) to sync planSlug
 * and grant monthly credits to the ledger.
 */
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, usageLedger } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { PLAN_GRANTS } from "@/lib/credits";

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  switch (evt.type) {
    case "organization.created": {
      const { id, name } = evt.data;
      // Mirror the org only — no credits here. Trial credits are granted once,
      // atomically, when the user *approves* their Brand Brain (see
      // approveBrain in the onboarding actions), so a signup that never
      // completes onboarding never holds spendable credits.
      await db.insert(organizations)
        .values({ clerkOrgId: id, name, planSlug: "trial", creditsBalance: 0 })
        .onConflictDoNothing();
      break;
    }
    case "organization.updated": {
      const { id, name } = evt.data;
      await db.update(organizations).set({ name, updatedAt: new Date() })
        .where(eq(organizations.clerkOrgId, id));
      break;
    }
    // Clerk Billing subscription events: map plan slug → grant credits.
    // Event names are Beta — verify against current Clerk docs when wiring.
    default: {
      const t = evt.type as string;
      if (t.startsWith("subscription")) {
        const orgClerkId = (evt.data as { payer?: { organization_id?: string } }).payer?.organization_id;
        const plan = (evt.data as { plan?: { slug?: string } }).plan?.slug as keyof typeof PLAN_GRANTS | undefined;
        if (orgClerkId && plan && PLAN_GRANTS[plan]) {
          const [org] = await db.select().from(organizations)
            .where(eq(organizations.clerkOrgId, orgClerkId));
          if (org) {
            await db.insert(usageLedger).values({
              orgId: org.id, reason: "plan_grant", credits: PLAN_GRANTS[plan],
              refType: "run", refId: org.id,
            });
            await db.update(organizations).set({
              planSlug: plan,
              creditsBalance: sql`${organizations.creditsBalance} + ${PLAN_GRANTS[plan]}`,
            }).where(eq(organizations.id, org.id));
          }
        }
      }
    }
  }
  return NextResponse.json({ ok: true });
}
