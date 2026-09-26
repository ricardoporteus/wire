import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { draftBrandBrain } from "@/jobs/brand-brain-drafter";
import { runIntelligence, scheduleMonthlyRuns } from "@/jobs/intelligence-pipeline";
import { ingestSource, diagnoseDocument, generateDocument } from "@/jobs/content-writer-pipeline";
import { repurposeDocument } from "@/jobs/repurposer";
import { refreshBrandFactsJob, scheduleBrandFactsRefresh } from "@/jobs/brand-facts";

// Each Inngest step runs inside one invocation of this route. Pinned rather
// than left to the project default: the measured keyword research steps take
// 1–3 minutes (see src/lib/keyword-research.ts).
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    draftBrandBrain,
    runIntelligence,
    scheduleMonthlyRuns,
    ingestSource,
    diagnoseDocument,
    generateDocument,
    repurposeDocument,
    refreshBrandFactsJob,
    scheduleBrandFactsRefresh,
  ],
});
