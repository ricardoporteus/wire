/**
 * Bulk write batch — progress while the run writes, then the download bundle.
 * Mavrix-admin only (same gate as the bulk writer that creates the batch).
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { requireOrg, isResourcesAdminOrg } from "@/lib/org";
import { getBatchState } from "../../bulk-actions";
import { BatchClient } from "./BatchClient";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId: clerkOrgId } = await auth();
  if (!clerkOrgId) redirect("/onboarding");

  const { org } = await requireOrg();
  if (!isResourcesAdminOrg(org)) redirect("/content");

  const initial = await getBatchState(id);
  if (initial.status === "unknown") redirect("/content");

  return <BatchClient batchId={id} initial={initial} />;
}
