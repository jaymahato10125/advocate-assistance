"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary — replaces the root layout, so it must render its own
 * <html>/<body>. Inline styles only: global CSS may not be available here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          backgroundColor: "#0b0f14",
          color: "#e7eae5",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#8c96a4", margin: 0, maxWidth: "28rem", textAlign: "center" }}>
          Vakeel Contracts hit an unexpected error. Retrying is safe — your
          contracts are stored server-side.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            cursor: "pointer",
            borderRadius: 8,
            border: "none",
            padding: "0.625rem 1.25rem",
            backgroundColor: "#4cbd90",
            color: "#06130d",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
