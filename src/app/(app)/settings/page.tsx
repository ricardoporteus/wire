import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";
import { draftFromRow } from "@/lib/wizard-steps";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) return null;

  const org = await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) });
  const brain = org ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) }) : null;

  if (!brain) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <span className="eyebrow">Settings</span>
        <h1 className="mt-4 text-h2 text-ink-green">Settings</h1>
        <p className="mt-2 text-muted">Finish onboarding to build your Brand Brain, then you can edit it here.</p>
      </main>
    );
  }

  return <SettingsClient brainId={brain.id} brainName={brain.name} initialDraft={draftFromRow(brain)} />;
}
