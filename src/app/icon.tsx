import { ImageResponse } from "next/og";

// Browser-tab favicon — same mark as apple-icon.tsx, smaller canvas.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const PIN = "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z";
const BITE =
  "M14.68 2.35 C15.95 0.6 17.68 2.48 18.98 1.0 C20.48 -0.7 22.0 2.05 21.0 3.75 C20.25 5.04 21.5 6.43 19.9 7.29 C18.3 8.15 17.8 6.5 16.13 7.13 C14.45 7.75 13.5 5.25 14.75 3.75 C15.38 3.0 13.9 2.6 14.68 2.35 Z";

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
        <svg width="23" height="23" viewBox="0 0 24 24">
          <path d={PIN} fill="#FBF2DD" />
          <path d={BITE} fill="#FF4321" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
