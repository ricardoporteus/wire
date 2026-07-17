/**
 * Sentry — server runtime init. No-ops until a DSN is set (SENTRY_DSN or the
 * public one), so the app builds and runs without Sentry configured. Imported by
 * instrumentation.ts on the Node runtime.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  // Send less in dev; the sample rate above governs performance tracing.
  environment: process.env.NODE_ENV,
});
