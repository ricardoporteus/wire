/**
 * Adopt a completed teaser scan into a newly created org's Brand Brain, once.
 * Lets a visitor who watched the Live Scan sign up and land on a dashboard that
 * is already populated — no re-scrape, no empty state.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains, demoScans } from "@/db/schema";
import { emptyDraft, DEFAULT_ETHICS, DEFAULT_FORMATS } from "@/lib/wizard-steps";

/** Returns the new brainId, or null if the token is unusable (missing, incomplete, already claimed). */
export async function claimDemoScan(orgId: string, token: string): Promise<string | null> {
  const scan = await db.query.demoScans.findFirst({ where: eq(demoScans.token, token) });
  if (!scan || scan.status !== "complete" || scan.claimedByOrgId || !scan.brainDraft) return null;

  const draft = scan.brainDraft;
  const seed = emptyDraft(draft.name, draft.siteUrl);

  const [brain] = await db
    .insert(brandBrains)
    .values({
      orgId,
      name: draft.name,
      siteUrl: draft.siteUrl,
      whatTheyDo: draft.whatTheyDo ?? seed.whatTheyDo,
      differentiator: draft.differentiator ?? null,
      icp: draft.icp ?? seed.icp,
      competitors: draft.competitors ?? seed.competitors,
      voice: draft.voice ?? seed.voice,
      vocabulary: draft.vocabulary ?? seed.vocabulary,
      values: draft.values ?? seed.values,
      approvedFacts: draft.approvedFacts ?? [],
      ethicsRules: draft.ethicsRules ?? DEFAULT_ETHICS,
      formats: DEFAULT_FORMATS.map((f) => ({ ...f })),
      aiDraftedAt: new Date(),
    })
    .returning();

  await db.update(demoScans).set({ claimedByOrgId: orgId }).where(eq(demoScans.id, scan.id));
  return brain.id;
}
