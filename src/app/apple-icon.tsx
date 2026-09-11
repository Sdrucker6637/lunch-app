import { ImageResponse } from "next/og";

// Next.js file-convention icon: this auto-generates the
// <link rel="apple-touch-icon"> tag, so this is what shows up as the app
// icon when someone taps Share -> Add to Home Screen in Safari. Reuses the
// same fork + knife glyph + chili background as the in-app header badge, so
// the home-screen icon, the header, and the browser tab all read as one
// mark.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#FBF2DD" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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
