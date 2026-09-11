import { ImageResponse } from "next/og";

// Browser-tab favicon — same mark as apple-icon.tsx, smaller canvas.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FF4321",
        }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#FBF2DD" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
          <line x1="10" y1="7" x2="10" y2="17" strokeDasharray="2 2" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
