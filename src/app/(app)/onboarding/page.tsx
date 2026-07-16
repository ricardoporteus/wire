/**
 * Onboarding entry. Resolves the caller's org + in-progress brain and hands the
 * client wizard its initial state. No org yet → create a workspace first;
 * already onboarded → straight to the dashboard.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";
import { draftFromRow } from "@/lib/wizard-steps";
import { Wizard } from "./Wizard";
import { CreateWorkspace } from "./CreateWorkspace";

export default async function OnboardingPage() {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) return null; // middleware protects this route; belt-and-braces
  if (!clerkOrgId) return <CreateWorkspace />;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });
  const brain = org
    ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) })
    : null;

  if (brain?.wizardCompletedAt) redirect("/dashboard");

  return (
    <main>
      <Wizard
        initialBrainId={brain?.id ?? null}
        initialDraft={brain ? draftFromRow(brain) : null}
        initialAiDrafted={!!brain?.aiDraftedAt}
      />
    </main>
  );
}
