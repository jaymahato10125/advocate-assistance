import { ImageResponse } from "next/og";

export const alt = "Advocate Contracts — AI contract review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "#0b0f14",
        color: "#e7eae5",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#4cbd90",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#06130d",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          ⚖
        </div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
          <span>Advocate</span>
          <span style={{ color: "#8c96a4", fontWeight: 400, marginLeft: 10 }}>
            Contracts
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 20,
            color: "#c9a44c",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          AI-powered contract review
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          <span>Every clause, read.</span>
          <span style={{ color: "#4cbd90" }}>Every risk, flagged.</span>
        </div>
        <div style={{ fontSize: 26, color: "#8c96a4", maxWidth: 900 }}>
          Key clauses, severity-tagged risk flags, an overall risk level, and
          recommendations — from a single upload.
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, fontSize: 18, color: "#8c96a4" }}>
        <span>PDF &amp; TXT</span>
        <span>·</span>
        <span>Gemini analysis</span>
        <span>·</span>
        <span>Key clauses &amp; risk flags</span>
      </div>
    </div>,
    { ...size },
  );
}
