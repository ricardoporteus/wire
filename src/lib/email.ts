/**
 * Transactional email via Resend. No-ops when RESEND_API_KEY is unset (local
 * dev, or before the key is configured), so callers never need to guard — the
 * send just silently does nothing, like the Sentry integration.
 */
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM ?? "Mavrix <notifications@mavrix.agency>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mavrix.agency";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** "Your N articles are ready" — fired once when a bulk write batch finishes. */
export async function sendBatchReadyEmail(opts: {
  to: string;
  batchId: string;
  readyCount: number;
  failedCount: number;
  titles: string[];
}): Promise<void> {
  if (!resend) return;
  const { to, batchId, readyCount, failedCount, titles } = opts;
  const link = `${APP_URL}/content/batch/${batchId}`;
  const list = titles.slice(0, 12).map((t) => `<li style="margin:4px 0">${esc(t)}</li>`).join("");
  const failed = failedCount > 0 ? `<p style="color:#9a3b32">${failedCount} piece${failedCount === 1 ? "" : "s"} didn't finish and can be retried.</p>` : "";
  const html = `<div style="font-family:-apple-system,Inter,system-ui,sans-serif;color:#102D23;max-width:560px;margin:0 auto">
    <h1 style="font-size:20px">Your ${readyCount} article${readyCount === 1 ? " is" : "s are"} ready</h1>
    <p>Your bulk write run finished. ${readyCount} piece${readyCount === 1 ? "" : "s"} wrote successfully.</p>
    ${failed}
    <ul style="padding-left:18px;color:#5C6B63;font-size:14px">${list}</ul>
    <p><a href="${link}" style="display:inline-block;background:#DBFE7A;color:#102D23;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:10px">Review &amp; download →</a></p>
    <p style="color:#5C6B63;font-size:12px">Each file includes its content brief / SEO sheet. Open the link to download all, or grab MD, HTML or Word per article.</p>
  </div>`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${readyCount} article${readyCount === 1 ? " is" : "s are"} ready to download`,
    html,
  });
}
