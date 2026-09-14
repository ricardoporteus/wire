import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { draftBrandBrain } from "@/jobs/brand-brain-drafter";
import { runIntelligence, scheduleMonthlyRuns } from "@/jobs/intelligence-pipeline";
import { ingestSource, diagnoseDocument, generateDocument } from "@/jobs/content-writer-pipeline";
import { repurposeDocument } from "@/jobs/repurposer";
import { refreshBrandFactsJob, scheduleBrandFactsRefresh } from "@/jobs/brand-facts";

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
