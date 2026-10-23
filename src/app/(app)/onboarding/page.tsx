/**
 * Onboarding entry. Resolves the caller's org + in-progress brain and hands the
 * client wizard its initial state. No org yet → create a workspace first;
 * already onboarded → straight to the dashboard.
 */
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";
import { draftFromRow } from "@/lib/wizard-steps";
import { claimDemoScan } from "@/lib/demo-claim";
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

/** Normalise a handoff URL from the marketing hero (query param or cookie). */
function pickUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let v = raw.trim();
  try { v = decodeURIComponent(v); } catch { /* already decoded */ }
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try { return new URL(v).href; } catch { return null; }
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; demo?: string }>;
}) {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) return null; // middleware protects this route; belt-and-braces

  // Handoffs from the marketing homepage: a URL to prefill the site step, and/or
  // a completed Live Scan token to adopt (query param or the cross-subdomain cookie).
  const sp = await searchParams;
  const cookieStore = await cookies();
  const prefillSiteUrl = pickUrl(sp?.url) ?? pickUrl(cookieStore.get("mavrix_onboard_url")?.value);
  const demoToken = (sp?.demo ?? cookieStore.get("mavrix_demo_token")?.value ?? "").trim() || null;

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
  let brain = org
    ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) })
    : null;

  // Adopt the Live Scan the visitor just watched: skips the site step entirely.
  if (org && !brain && demoToken) {
    const brainId = await claimDemoScan(org.id, demoToken).catch(() => null);
    if (brainId) brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, brainId) });
  }

  if (brain?.wizardCompletedAt) redirect("/dashboard");

  return (
    <>
      <OnboardingHeader />
      <main>
        <Wizard
          initialBrainId={brain?.id ?? null}
          initialDraft={brain ? draftFromRow(brain) : null}
          initialAiDrafted={!!brain?.aiDraftedAt}
          initialSiteUrl={prefillSiteUrl}
        />
      </main>
    </>
  );
}
