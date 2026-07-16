/**
 * Root route. Wire has no marketing landing page yet, so `/` just routes the
 * visitor to the right place instead of 404ing (e.g. Clerk's OrganizationSwitcher
 * bouncing here after an org is created). Unauthenticated users hit a protected
 * route and get bounced to Clerk sign-in by middleware; signed-in users go to the
 * dashboard, or onboarding if their Brand Brain isn't built yet.
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";

export default async function RootPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard"); // middleware handles sign-in / workspace setup

  const org = await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, orgId) });
  const brain = org ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) }) : null;
  redirect(brain?.wizardCompletedAt ? "/dashboard" : "/onboarding");
}
