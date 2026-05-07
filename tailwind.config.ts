import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm-leaning near-black surfaces (z-layered system)
        base: "#0B0A09",
        panel: "#111014",
        elevated: "#17151B",
        floating: "#1E1B22",
        // Borders / dividers
        hairline: "#26242C",
        edge: "#332F38",
        // Text
        ink: {
          DEFAULT: "#EDEAE2",
          muted: "#9A958A",
          dim: "#6B665C",
          faint: "#4A463F",
        },
        // Single warm accent (NOT default Tailwind)
        amber: {
          DEFAULT: "#F4B860",
          glow: "#F4B860",
          dim: "#A8804A",
          deep: "#5C4528",
        },
        // Signal colors (use sparingly)
        urgent: "#E06C75",
        warn: "#E5A66A",
        link: "#5BA3A8",
        ok: "#9BB369",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-instrument)", "ui-serif", "Georgia", "serif"],
      },
      letterSpacing: {
        "tightest-display": "-0.04em",
        "tight-display": "-0.025em",
      },
      boxShadow: {
        // Layered, color-tinted shadows (no flat shadow-md)
        elevated:
          "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 1px 2px 0 rgba(0,0,0,0.5), 0 4px 12px -2px rgba(0,0,0,0.4)",
        floating:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 8px -2px rgba(0,0,0,0.6), 0 16px 32px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(244,184,96,0.04)",
        glow: "0 0 0 1px rgba(244,184,96,0.18), 0 0 24px -4px rgba(244,184,96,0.25)",
        ring: "0 0 0 1px rgba(244,184,96,0.4), 0 0 0 4px rgba(244,184,96,0.08)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        scan: "scan 6s linear infinite",
        blink: "blink 1.1s steps(2, start) infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.92)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
