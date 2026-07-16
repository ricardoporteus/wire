"use server";

/**
 * WIRE — Onboarding wizard server actions.
 *
 * Every action is org-scoped: a brain is only ever read or written after
 * confirming it belongs to the caller's active Clerk org. Per-step saves are
 * Zod-validated with the same schemas the client uses. Approve is the one
 * transaction that completes the brain, grants the trial credits, and enqueues
 * the first intelligence run.
 */

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { inngest } from "@/lib/inngest";
import { PLAN_GRANTS } from "@/lib/credits";
import {
  brandBrains, organizations, intelligenceRuns, usageLedger,
} from "@/db/schema";
import { brandBrainSchema } from "@/lib/brand-brain.zod";
import {
  STEP_SCHEMAS, type StepKey, draftFromRow, emptyDraft, DEFAULT_ETHICS, DEFAULT_FORMATS,
} from "@/lib/wizard-steps";

/* ------------------------------- ownership -------------------------------- */

async function ownedBrain(brainId: string) {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) throw new Error("no_active_org");
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.id, brainId) });
  if (!brain) throw new Error("brain_not_found");
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, brain.orgId) });
  if (!org || org.clerkOrgId !== clerkOrgId) throw new Error("forbidden");
  return { brain, org };
}

/** Blank row values for a freshly created brain (jsonb NOT NULL columns need seeds). */
function emptyBrainRow(name: string, siteUrl: string) {
  const d = emptyDraft(name, siteUrl);
  return {
    name: d.name,
    siteUrl: d.siteUrl,
    whatTheyDo: d.whatTheyDo,
    differentiator: null as string | null,
    icp: d.icp,
    competitors: d.competitors,
    voice: d.voice,
    vocabulary: d.vocabulary,
    values: d.values,
    approvedFacts: d.approvedFacts,
    ethicsRules: DEFAULT_ETHICS,
    formats: DEFAULT_FORMATS.map((f) => ({ ...f })),
  };
}

/* --------------------------- step 0: site scan ---------------------------- */

/**
 * Create (or reuse) the org's in-progress brain and stamp name + URL. When
 * `draftIt` is true (the default), fires the "draft it for me" job; the wizard
 * then polls `getBrainState`. When false, returns a blank brain to fill by hand.
 */
export async function startDraft(input: {
  name: string;
  siteUrl: string;
  uploadedDocText?: string;
  draftIt?: boolean;
}) {
  const { org } = await requireOrg();

  let brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (brain?.wizardCompletedAt) throw new Error("already_onboarded");

  if (!brain) {
    [brain] = await db
      .insert(brandBrains)
      .values({ orgId: org.id, ...emptyBrainRow(input.name, input.siteUrl) })
      .returning();
  } else {
    await db.update(brandBrains)
      .set({ name: input.name, siteUrl: input.siteUrl, updatedAt: new Date() })
      .where(eq(brandBrains.id, brain.id));
  }

  if (input.draftIt !== false) {
    await inngest.send({
      name: "wire/brand-brain.draft.requested",
      data: { brainId: brain.id, siteUrl: input.siteUrl, uploadedDocText: input.uploadedDocText },
    });
  }

  return { brainId: brain.id };
}

/** Editable columns the wizard may write directly (lenient — no strict gate). */
const EDITABLE_KEYS = [
  "whatTheyDo", "differentiator", "icp", "competitors", "voice",
  "vocabulary", "values", "approvedFacts", "ethicsRules", "formats",
] as const;

/**
 * Persist a slice without strict validation. Used when a user skips an optional
 * step but we still want to keep whatever they (or the AI) put there. Approve is
 * the authoritative gate, so incomplete data here is fine.
 */
export async function savePartial(brainId: string, data: Record<string, unknown>) {
  await ownedBrain(brainId);
  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE_KEYS) if (k in data) patch[k] = data[k];
  if (Object.keys(patch).length === 0) return { ok: true as const };
  await db.update(brandBrains)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(brandBrains.id, brainId));
  return { ok: true as const };
}

/* --------------------------- read / poll state ---------------------------- */

/** Current editable state of a brain, plus draft/completion flags for polling. */
export async function getBrainState(brainId: string) {
  const { brain } = await ownedBrain(brainId);
  return {
    draft: draftFromRow(brain),
    aiDraftedAt: brain.aiDraftedAt ? brain.aiDraftedAt.toISOString() : null,
    wizardCompletedAt: brain.wizardCompletedAt ? brain.wizardCompletedAt.toISOString() : null,
  };
}

/* ----------------------------- per-step save ------------------------------ */

/**
 * Validate one step's slice with its schema and persist just those columns.
 * Returns a flattened error map on failure so the wizard can show it inline.
 */
export async function saveStep(brainId: string, step: StepKey, data: unknown) {
  await ownedBrain(brainId);
  const schema = STEP_SCHEMAS[step];
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }
  await db.update(brandBrains)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(brandBrains.id, brainId));
  return { ok: true as const };
}

/* -------------------------------- approve --------------------------------- */

/**
 * The one atomic close: validate the whole Brain, set wizardCompletedAt, grant
 * trial credits to the ledger (once per org), and enqueue the first intelligence
 * run. The pipeline debits its own 100 credits when it starts.
 */
export async function approveBrain(brainId: string) {
  const { brain, org } = await ownedBrain(brainId);

  if (brain.wizardCompletedAt) {
    return { ok: true as const, alreadyDone: true as const };
  }

  const parsed = brandBrainSchema.safeParse(brain);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  // Grant the trial only for the org's first completed brain.
  const priorGrant = await db.query.usageLedger.findFirst({
    where: and(eq(usageLedger.orgId, org.id), eq(usageLedger.reason, "plan_grant")),
  });

  const runId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.update(brandBrains)
      .set({ wizardCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(brandBrains.id, brainId));

    if (!priorGrant) {
      await tx.insert(usageLedger).values({
        orgId: org.id, brainId, reason: "plan_grant",
        credits: PLAN_GRANTS.trial, refType: "run", refId: org.id,
      });
      await tx.update(organizations)
        .set({ creditsBalance: sql`${organizations.creditsBalance} + ${PLAN_GRANTS.trial}` })
        .where(eq(organizations.id, org.id));
    }

    await tx.insert(intelligenceRuns).values({
      id: runId, brainId, trigger: "onboarding", status: "queued",
    });
  });

  await inngest.send({
    name: "wire/intelligence.run.requested",
    data: { runId, brainId, orgId: org.id },
  });

  return { ok: true as const, runId };
}
