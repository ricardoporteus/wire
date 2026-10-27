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

/**
 * The Resources library / Blog Schedule is Mavrix's own publishing surface, not
 * a per-tenant feature — the corpus is global, hardcoded content. So that page
 * and its nav item are shown only for the Mavrix admin org; every other org is
 * blocked out. Configurable via MAVRIX_ADMIN_ORG (comma-separated Clerk org ids
 * and/or names); defaults to the org literally named "Mavrix".
 */
export function isResourcesAdminOrg(org: { clerkOrgId: string; name: string }): boolean {
  const configured = (process.env.MAVRIX_ADMIN_ORG ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (configured.length) {
    const name = org.name.trim().toLowerCase();
    return configured.some((c) => c === org.clerkOrgId || c.toLowerCase() === name);
  }
  return org.name.trim().toLowerCase() === "mavrix";
}

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
