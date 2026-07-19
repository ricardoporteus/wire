/**
 * WIRE — credits helper
 * One function every AI action goes through. Atomic debit with a row lock;
 * throws NonRetriableCreditError on insufficient balance so Inngest fails the
 * job cleanly instead of retrying into the same wall.
 *
 * The price list itself lives in lib/credit-costs, which imports nothing, so
 * client components can quote the numbers without pulling Drizzle and the Neon
 * driver into the browser bundle. Re-exported here so existing server callers
 * keep working unchanged.
 */
export { CREDIT_COSTS, PLAN_GRANTS } from "@/lib/credit-costs";
import { CREDIT_COSTS } from "@/lib/credit-costs";

import { db } from "@/lib/db";
import { organizations, usageLedger } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class NonRetriableCreditError extends Error {
  constructor() { super("insufficient_credits"); }
}

export async function debitCredits(opts: {
  orgId: string;
  brainId?: string;
  reason: keyof typeof CREDIT_COSTS;
  refType: "run" | "document" | "export";
  refId: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsdMicros?: number;
}) {
  const credits = CREDIT_COSTS[opts.reason];
  await db.transaction(async (tx) => {
    const [org] = await tx.select().from(organizations)
      .where(eq(organizations.id, opts.orgId)).for("update");
    if (!org || org.creditsBalance < credits) throw new NonRetriableCreditError();
    await tx.insert(usageLedger).values({
      orgId: opts.orgId, brainId: opts.brainId ?? null,
      reason: opts.reason, credits: -credits,
      refType: opts.refType, refId: opts.refId,
      tokensIn: opts.tokensIn ?? 0, tokensOut: opts.tokensOut ?? 0,
      costUsdMicros: opts.costUsdMicros ?? 0,
    });
    await tx.update(organizations)
      .set({ creditsBalance: sql`${organizations.creditsBalance} - ${credits}` })
      .where(eq(organizations.id, opts.orgId));
  });
}

/** Record token telemetry after the fact (COGS), without touching credits. */
export async function recordUsage(opts: {
  orgId: string; brainId?: string;
  refType: "run" | "document" | "export"; refId: string;
  tokensIn: number; tokensOut: number; costUsdMicros: number;
}) {
  await db.insert(usageLedger).values({
    orgId: opts.orgId, brainId: opts.brainId ?? null,
    reason: "adjustment", credits: 0,
    refType: opts.refType, refId: opts.refId,
    tokensIn: opts.tokensIn, tokensOut: opts.tokensOut,
    costUsdMicros: opts.costUsdMicros,
  });
}
