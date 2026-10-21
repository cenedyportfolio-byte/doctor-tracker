"use client";

/**
 * Last-resort boundary for errors in the root layout. It replaces the whole document, so it
 * renders its own <html>/<body> and uses inline styles (global CSS is not loaded here).
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#fafafa",
          color: "#18181b",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <title>Something went wrong · Doctor Tracker</title>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#52525b", fontSize: 14, marginTop: 8 }}>
            The page couldn&apos;t be displayed.{digest ? ` (ref: ${digest})` : ""}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              height: 36,
              padding: "0 14px",
              borderRadius: 6,
              border: "1px solid #d4d4d8",
              background: "#ffffff",
              color: "#18181b",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
