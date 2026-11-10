/**
 * Write (Quill) — start a new piece. Paste text, a URL, or an audio/video link;
 * Mavrix diagnoses it, then writes. The draft itself opens at /write/[id].
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandBrains } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { NewDocument } from "./NewDocument";

export default async function WritePage() {
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) redirect("/onboarding");

  const { org } = await requireOrg();
  const brain = await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) });
  if (!brain?.wizardCompletedAt) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <span className="eyebrow">Write · Quill</span>
      <h1 className="mt-4 text-h2 text-ink-green">New piece</h1>
      <p className="mt-2 text-body-sm text-muted">
        Paste text, a URL, or an audio/video link. Mavrix diagnoses what it should become, grounded in your Brand Brain and keyword intelligence, before it writes a word.
      </p>
      <div className="mt-6"><NewDocument /></div>
    </main>
  );
}
