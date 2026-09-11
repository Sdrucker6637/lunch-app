import { ImageResponse } from "next/og";

// Next.js file-convention icon: this auto-generates the
// <link rel="apple-touch-icon"> tag, so this is what shows up as the app
// icon when someone taps Share -> Add to Home Screen in Safari. Reuses the
// same ticket glyph + chili background as the in-app header badge, so the
// home-screen icon, the header, and the browser tab all read as one mark.
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
        <svg width="118" height="118" viewBox="0 0 24 24" fill="none" stroke="#FBF2DD" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
          <line x1="10" y1="7" x2="10" y2="17" strokeDasharray="2 2" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
