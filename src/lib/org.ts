/**
 * WIRE — org resolution for server actions.
 *
 * The Clerk webhook is the authoritative writer of the `organizations` mirror,
 * but two cases need a lazy fallback: local dev without webhooks configured, and
 * the race where a user creates an org and reaches onboarding before the
 * `organization.created` webhook lands. `requireOrg` upserts the mirror from the
 * active Clerk org so onboarding never dead-ends on a missing row. It grants no
 * credits — the trial grant happens once, at wizard approval.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireOrg() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) throw new Error("no_active_org");

  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });
  if (existing) return { org: existing, clerkOrgId };

  const client = await clerkClient();
  const clerkOrg = await client.organizations.getOrganization({ organizationId: clerkOrgId });
  const [org] = await db
    .insert(organizations)
    .values({ clerkOrgId, name: clerkOrg.name })
    .onConflictDoUpdate({ target: organizations.clerkOrgId, set: { name: clerkOrg.name } })
    .returning();
  return { org, clerkOrgId };
}
