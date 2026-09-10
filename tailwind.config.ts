import type { Config } from "tailwindcss";

// "Lunch Radius" design system v2 — "deli counter meets scoreboard".
// Bold black outlines + hard offset shadows (stamped/tactile, not flat
// SaaS-soft), a poster-display font for scores/headlines, warm paper stock
// instead of pastel-on-cream. Every surface should feel printed, punched,
// or stamped rather than rendered.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FBF2DD",
          50: "#FFFCF6",
          100: "#FBF2DD",
          200: "#F5E6C4",
        },
        ink: {
          DEFAULT: "#201A14",
          soft: "#5B4E3F",
          faint: "#8C7C64",
        },
        chili: {
          DEFAULT: "#FF4321",
          50: "#FFEDE7",
          100: "#FFD8C9",
          300: "#FF7A54",
          500: "#FF4321",
          600: "#E32D0D",
          700: "#B4220A",
        },
        yolk: {
          DEFAULT: "#FFB800",
          100: "#FFF0C2",
          300: "#FFCE47",
          500: "#FFB800",
          600: "#E29E00",
        },
        pickle: {
          DEFAULT: "#1E8E4F",
          100: "#DAF3E4",
          300: "#5FC383",
          500: "#1E8E4F",
          600: "#136D3B",
        },
        plum: {
          DEFAULT: "#7A3FE0",
          100: "#EBE1FC",
          300: "#B18BF2",
          500: "#7A3FE0",
          600: "#5F27BE",
        },
        // legacy aliases kept so any un-migrated class doesn't hard-fail
        cream: { DEFAULT: "#FBF2DD", 50: "#FFFCF6", 100: "#FBF2DD", 200: "#F5E6C4" },
        coral: { DEFAULT: "#FF4321", 50: "#FFEDE7", 100: "#FFD8C9", 300: "#FF7A54", 500: "#FF4321", 600: "#E32D0D", 700: "#B4220A" },
        sunny: { DEFAULT: "#FFB800", 100: "#FFF0C2", 300: "#FFCE47", 500: "#FFB800", 600: "#E29E00" },
        fresh: { DEFAULT: "#1E8E4F", 100: "#DAF3E4", 300: "#5FC383", 500: "#1E8E4F", 600: "#136D3B" },
        berry: { DEFAULT: "#B4220A", 500: "#B4220A" },
      },
      fontFamily: {
        display: ["var(--font-anton)", "Impact", "sans-serif"],
        body: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
        ticket: "0.9rem",
      },
      boxShadow: {
        // Hard offset "sticker" shadows — no blur, pure black, so cards read
        // as printed/stamped objects sitting on the paper, not floating
        // panels. Three weights for stacking hierarchy.
        stamp: "3px 3px 0 0 #201A14",
        "stamp-sm": "2px 2px 0 0 #201A14",
        "stamp-lg": "5px 5px 0 0 #201A14",
        "stamp-chili": "3px 3px 0 0 #B4220A",
        "stamp-pickle": "3px 3px 0 0 #136D3B",
        "stamp-yolk": "3px 3px 0 0 #E29E00",
        card: "0 2px 10px -2px rgba(32,26,20,0.08)",
        pop: "0 8px 24px -6px rgba(255,67,33,0.35)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "stamp-slam": {
          "0%": { transform: "scale(2.4) rotate(-14deg)", opacity: "0" },
          "55%": { transform: "scale(0.94) rotate(-6deg)", opacity: "1" },
          "75%": { transform: "scale(1.05) rotate(-8deg)" },
          "100%": { transform: "scale(1) rotate(-6deg)", opacity: "1" },
        },
        "press-in": {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(2px,2px)" },
        },
        "count-pulse": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        marquee: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 0" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
        wiggle: "wiggle 0.4s ease-in-out",
        "stamp-slam": "stamp-slam 0.5s cubic-bezier(.2,1.4,.4,1) forwards",
        "press-in": "press-in 0.1s ease-out forwards",
        "count-pulse": "count-pulse 0.4s ease-out",
        float: "float 3s ease-in-out infinite",
        marquee: "marquee 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
