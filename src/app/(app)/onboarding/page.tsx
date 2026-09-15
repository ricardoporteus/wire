/**
 * Onboarding entry. Resolves the caller's org + in-progress brain and hands the
 * client wizard its initial state. No org yet → create a workspace first;
 * already onboarded → straight to the dashboard.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";
import { draftFromRow } from "@/lib/wizard-steps";
import { Wizard } from "./Wizard";
import { CreateWorkspace } from "./CreateWorkspace";

/**
 * Minimal onboarding chrome. The app header is hidden here to keep the wizard
 * focused, but the org switcher must stay reachable: a session landing on the
 * wrong workspace (or a freshly created empty one) needs a way back to an
 * existing workspace instead of being trapped in a fresh wizard.
 */
function OnboardingHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <span className="font-display text-h5 font-semibold text-ink-green">Mavrix</span>
        <OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" hidePersonal />
      </div>
    </header>
  );
}

export default async function OnboardingPage() {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) return null; // middleware protects this route; belt-and-braces
  if (!clerkOrgId) {
    return (
      <>
        <OnboardingHeader />
        <CreateWorkspace />
      </>
    );
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkOrgId),
  });
  const brain = org
    ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) })
    : null;

  if (brain?.wizardCompletedAt) redirect("/dashboard");

  return (
    <>
      <OnboardingHeader />
      <main>
        <Wizard
          initialBrainId={brain?.id ?? null}
          initialDraft={brain ? draftFromRow(brain) : null}
          initialAiDrafted={!!brain?.aiDraftedAt}
        />
      </main>
    </>
  );
}
