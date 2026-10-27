/**
 * Bulk-write batch completion. Idempotent: called both from the Inngest
 * settled-event handler (so the completion email fires even if the user closed
 * the tab) and from the batch-state poll (a belt-and-suspenders fallback if an
 * event is missed). A conditional "writing → done" update guarantees only one
 * caller finalizes and sends the email.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, writeBatches } from "@/db/schema";
import { sendBatchReadyEmail } from "@/lib/email";

/** A batch document is "settled" once it can no longer change on its own. */
export const SETTLED_DOC_STATUS = new Set(["draft", "final", "archived", "failed"]);
const OK_DOC_STATUS = new Set(["draft", "final"]);

export async function finalizeBatchIfComplete(batchId: string): Promise<void> {
  const batch = await db.query.writeBatches.findFirst({ where: eq(writeBatches.id, batchId) });
  if (!batch || batch.status !== "writing") return;

  const docs = await db.query.documents.findMany({ where: eq(documents.batchId, batchId) });
  const settled = docs.filter((d) => SETTLED_DOC_STATUS.has(d.status));
  if (settled.length < batch.total) return; // not done yet

  // Flip writing → done exactly once; whoever wins this race sends the email.
  const won = await db
    .update(writeBatches)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(writeBatches.id, batchId), eq(writeBatches.status, "writing")))
    .returning({ id: writeBatches.id });
  if (!won.length) return;

  if (batch.notifyEmail && !batch.notifiedAt) {
    const ok = docs.filter((d) => OK_DOC_STATUS.has(d.status));
    try {
      await sendBatchReadyEmail({
        to: batch.notifyEmail,
        batchId,
        readyCount: ok.length,
        failedCount: docs.length - ok.length,
        titles: ok.map((d) => d.title ?? "Untitled piece"),
      });
    } catch {
      // Email is best-effort — never block batch completion on a send failure.
    }
    await db.update(writeBatches).set({ notifiedAt: new Date() }).where(eq(writeBatches.id, batchId));
  }
}
