/**
 * App shell for every signed-in surface: a full-width news ticker, the left
 * navigation, and the page content. Onboarding renders without the shell.
 *
 * ClerkProvider lives here rather than in the root layout so that the public
 * marketing and legal pages ship no Clerk JavaScript.
 */
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains, intelligenceRuns, documents, keywords, contentIdeas } from "@/db/schema";
import { isResourcesAdminOrg } from "@/lib/org";
import { AppShell, type TickerItem } from "./AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgId: clerkOrgId } = await auth();
  const org = clerkOrgId
    ? await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) })
    : null;

  // Live ticker — real, derivable facts only (no fabricated wins).
  const ticker: TickerItem[] = [];
  if (org) {
    const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
    if (brain) {
      const run = await db.query.intelligenceRuns.findFirst({
        where: eq(intelligenceRuns.brainId, brain.id),
        orderBy: [desc(intelligenceRuns.createdAt)],
      });
      const [draftRows, kwRows, ideaRows] = await Promise.all([
        db.select({ n: count() }).from(documents).where(and(eq(documents.brainId, brain.id), eq(documents.status, "draft"))),
        run ? db.select({ n: count() }).from(keywords).where(eq(keywords.runId, run.id)) : Promise.resolve([{ n: 0 }]),
        run ? db.select({ n: count() }).from(contentIdeas).where(eq(contentIdeas.runId, run.id)) : Promise.resolve([{ n: 0 }]),
      ]);
      const now = new Date();
      const nextSweep = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 6));
      const days = Math.max(0, Math.ceil((nextSweep.getTime() - now.getTime()) / 86_400_000));

      if (run) ticker.push({ label: "Last intelligence run", value: `${kwRows[0].n} keywords, ${ideaRows[0].n} ideas` });
      if (draftRows[0].n > 0) {
        ticker.push({ label: `${draftRows[0].n} draft${draftRows[0].n === 1 ? "" : "s"}`, value: "ready to review and publish" });
      }
      ticker.push({ label: "Next monthly sweep", value: days === 0 ? "due today" : `in ${days} day${days === 1 ? "" : "s"}` });
      ticker.push({ label: "Credits", value: `${org.creditsBalance} remaining this cycle` });
    }
  }

  // Blog Schedule is a Mavrix-only admin surface (global Resources library).
  const showBlogSchedule = !!org && isResourcesAdminOrg(org);

  return (
    <ClerkProvider>
      <AppShell creditsBalance={org ? org.creditsBalance : null} ticker={ticker} showBlogSchedule={showBlogSchedule}>
        {children}
      </AppShell>
    </ClerkProvider>
  );
}
