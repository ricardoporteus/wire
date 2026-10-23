/**
 * Public "Live Scan" endpoint — anonymous, no auth (middleware leaves /api
 * unprotected, and this handler never calls Clerk). It runs a bounded real scan
 * of the posted URL and streams NDJSON events into the marketing modal.
 *
 * Cost/abuse guards: per-IP rate limit + a global daily cap (both fail-open),
 * and the per-domain cache in runDemoScan means repeat domains spend nothing.
 */
import { createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { runDemoScan } from "@/lib/demo-scan";
import type { DemoEvent } from "@/lib/demo-scan-types";

export const runtime = "nodejs";
export const maxDuration = 300;

const IP_MAX_PER_HOUR = 60;
const GLOBAL_MAX_PER_DAY = 500;

export async function POST(req: Request) {
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.trim() : "";
  } catch { /* invalid body handled below */ }
  if (!url || !url.includes(".")) {
    return Response.json({ error: "Enter a valid website URL." }, { status: 400 });
  }

  // Per-IP rate limit.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const perIp = await rateLimit(`demo_scan_ip:${ipHash}`, IP_MAX_PER_HOUR, 3600);
  if (!perIp.ok) {
    return Response.json({ error: "Too many scans from here. Try again shortly.", retryAfterSec: perIp.retryAfterSec }, { status: 429 });
  }
  // Global daily cap — a hard ceiling on anonymous spend.
  const global = await rateLimit("demo_scan_global:day", GLOBAL_MAX_PER_DAY, 86_400);
  if (!global.ok) {
    return Response.json({ error: "The live scan is at capacity today. Please try again tomorrow or sign up." }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (ev: DemoEvent) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n")); } catch { /* client gone */ }
      };
      try {
        await runDemoScan(url, emit);
      } catch { /* runDemoScan already emitted {t:"error"} */ } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
