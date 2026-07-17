/**
 * Sentry — edge runtime init (middleware, edge routes). No-ops until a DSN is set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
