/**
 * Bulk-write batch jobs. When a batch document settles (the writer pipeline
 * emits wire/batch.doc.settled on success or terminal failure), check whether
 * the whole batch is finished and, if so, mark it done and fire the one
 * completion email — even if the user has closed the tab. The actual logic is
 * the idempotent finalizeBatchIfComplete, shared with the batch-state poll.
 */
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { documents } from "@/db/schema";
import { finalizeBatchIfComplete } from "@/lib/batch";

export const finalizeBatchDoc = inngest.createFunction(
  { id: "batch-doc-settled", retries: 2 },
  { event: "wire/batch.doc.settled" },
  async ({ event, step }) => {
    const { documentId } = event.data as { documentId: string };
    const doc = await step.run("load-doc", () =>
      db.query.documents.findFirst({ where: eq(documents.id, documentId) }));
    if (!doc?.batchId) return { ok: true, batched: false };
    await step.run("finalize", () => finalizeBatchIfComplete(doc.batchId!));
    return { ok: true };
  },
);
