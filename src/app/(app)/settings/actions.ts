"use server";

/**
 * Settings server actions — currently the manual "Refresh facts from live site"
 * control for the Brand Brain's approved facts. The refresh itself is a long
 * (web-searching) job, so this only enqueues it and the client polls
 * getApprovedFacts to show the result.
 */

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { brandBrains, organizations } from "@/db/schema";

/** Confirm the brain belongs to the caller's active Clerk org before touching it. */
async function ownedBrain(brainId: string) {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) throw new Error("no_active_org");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, brainId) });
  if (!brain) throw new Error("brain_not_found");
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) });
  if (!org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");
  return brain;
}

/** Enqueue a live-site fact refresh for this brain. */
export async function requestFactsRefresh(brainId: string) {
  await ownedBrain(brainId);
  await inngest.send({ name: "wire/brand-facts.refresh.requested", data: { brainId } });
  return { ok: true as const };
}

/** Current approved facts + last-updated, for the client to poll after a refresh. */
export async function getApprovedFacts(brainId: string) {
  const brain = await ownedBrain(brainId);
  return {
    approvedFacts: brain.approvedFacts ?? [],
    updatedAt: brain.updatedAt ? brain.updatedAt.toISOString() : null,
  };
}
