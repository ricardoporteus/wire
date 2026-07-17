/**
 * Next.js instrumentation hook. Loads the Sentry init for the active runtime and
 * wires server-side request errors to Sentry. Safe when Sentry has no DSN — the
 * init calls no-op.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in server components, route handlers, and server actions.
export const onRequestError = Sentry.captureRequestError;
