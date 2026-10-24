import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (channel triplets) defined in globals.css,
// so light/dark theming is a single source of truth. Palette 1 "Verified Trust
// & Digital Innovation": navy ink + teal digital accent + emerald verification.
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        bg: withAlpha("--bg"),
        card: withAlpha("--card"),
        "card-raised": withAlpha("--card-raised"),
        border: withAlpha("--border"),
        fg: withAlpha("--fg"),
        muted: withAlpha("--muted"),
        "muted-weak": withAlpha("--muted-weak"),
        ink: withAlpha("--ink"),
        teal: withAlpha("--teal"),
        emerald: withAlpha("--emerald"),
        "emerald-bright": withAlpha("--emerald-bright"),
        amber: withAlpha("--amber"),
        "amber-bright": withAlpha("--amber-bright"),
        rose: withAlpha("--rose"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(10 37 64 / 0.04), 0 8px 24px -12px rgb(10 37 64 / 0.12)",
        glow: "0 0 0 1px rgb(var(--teal) / 0.4), 0 0 28px -6px rgb(var(--teal) / 0.45)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
