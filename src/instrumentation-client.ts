/**
 * Sentry — browser init. Uses the public DSN (must be NEXT_PUBLIC_* to reach the
 * client). No-ops until set. Session Replay is off by default to avoid capturing
 * customers' content; turn it on deliberately if you want it.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  environment: process.env.NODE_ENV,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
