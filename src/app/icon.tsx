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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FBF2DD" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v9" />
          <path d="M4 2v5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2" />
          <path d="M6 11v11" />
          <path d="M17 2c-2 0-3 3-3 6 0 2 1 3 3 3v11" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
