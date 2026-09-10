import type { Config } from "tailwindcss";

// "Lunch Radius" design system — bright, energetic, distinct from any dark
// editorial theme. Warm citrus palette on a light, airy ground: coral for
// primary actions, sunny yellow for highlights/streak energy, fresh green
// for "close by / good to go" signals. Rounded, friendly shapes throughout.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FFFBF3",
          50: "#FFFEFC",
          100: "#FFFBF3",
          200: "#FFF3DE",
        },
        ink: {
          DEFAULT: "#2A2420",
          soft: "#5C5349",
          faint: "#8C8177",
        },
        coral: {
          DEFAULT: "#FF5A36",
          50: "#FFF1EC",
          100: "#FFDED2",
          300: "#FF8A6B",
          500: "#FF5A36",
          600: "#E8471F",
          700: "#C43A18",
        },
        sunny: {
          DEFAULT: "#FFC93C",
          100: "#FFF3D2",
          300: "#FFDD7A",
          500: "#FFC93C",
          600: "#F0AE0E",
        },
        fresh: {
          DEFAULT: "#1FB6A6",
          100: "#DAF5F0",
          300: "#6ED9C9",
          500: "#1FB6A6",
          600: "#149183",
        },
        berry: {
          DEFAULT: "#B23A6E",
          500: "#B23A6E",
        },
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(42,36,32,0.08), 0 1px 2px rgba(42,36,32,0.06)",
        pop: "0 8px 24px -6px rgba(255,90,54,0.35)",
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
      },
      animation: {
        pop: "pop 0.18s ease-out",
        wiggle: "wiggle 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
