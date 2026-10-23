/**
 * Attach a captured email to an in-flight/completed demo scan. Public, no auth.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoScans } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let token = "", email = "";
  try {
    const b = await req.json();
    token = typeof b?.token === "string" ? b.token : "";
    email = typeof b?.email === "string" ? b.email.trim() : "";
  } catch { /* handled below */ }
  if (!token || !/.+@.+\..+/.test(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }
  await db.update(demoScans)
    .set({ email: email.slice(0, 255) })
    .where(eq(demoScans.token, token))
    .catch(() => {});
  return Response.json({ ok: true });
}
