import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1180px" } },
    extend: {
      colors: {
        bd: {
          bg: "hsl(var(--bd-bg))",
          section: "hsl(var(--bd-section))",
          ink: "hsl(var(--bd-ink))",
          inkSoft: "hsl(var(--bd-ink-soft))",
          teal: "hsl(var(--bd-teal))",
          tealDeep: "hsl(var(--bd-teal-deep))",
          mint: "hsl(var(--bd-mint))",
          mintMuted: "hsl(var(--bd-mint-muted))",
          border: "hsl(var(--bd-border))",
        },
      },
      fontFamily: {
        display: ["var(--font-body)", "ui-sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif"],
      },
      animation: {
        "marquee": "marquee 38s linear infinite",
        "pulse-ring": "pulse-ring 2.6s ease-out infinite",
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(150 100% 80% / 0.4)" },
          "50%": { boxShadow: "0 0 0 14px hsl(150 100% 80% / 0)" },
        },
      },
    },
  },
  plugins: [animate],
};
export default config;
