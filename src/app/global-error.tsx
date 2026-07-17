"use client";

/**
 * App Router global error boundary. Catches React rendering errors that escape
 * page/layout boundaries and reports them to Sentry (no-op if Sentry has no DSN).
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ maxWidth: 480, margin: "20vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", textAlign: "center", color: "#102D23" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, color: "#5b6b63" }}>
            An unexpected error occurred. Please refresh the page, or head back to your dashboard.
          </p>
          <a href="/dashboard" style={{ display: "inline-block", marginTop: 20, color: "#2563eb" }}>Back to dashboard →</a>
        </div>
      </body>
    </html>
  );
}
