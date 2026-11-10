/**
 * Client-upload authorization for the file-upload converter (Mavrix-admin only).
 *
 * The browser uploads the media file straight to Vercel Blob (bypassing the
 * serverless body limit, so large recordings work); this route only issues the
 * short-lived client token, after checking the caller is signed in and in the
 * Mavrix admin org. The source + document are created afterwards by the
 * createFromUpload server action, not here.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireOrg, isResourcesAdminOrg } from "@/lib/org";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        // Gate: only the Mavrix admin org may upload (feature is admin-first).
        const { org } = await requireOrg();
        if (!isResourcesAdminOrg(org)) throw new Error("forbidden");
        return {
          allowedContentTypes: ["audio/*", "video/*", "application/octet-stream"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // No onUploadCompleted: the client calls createFromUpload once the upload
      // resolves, so we don't rely on the server-to-server completion webhook.
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
