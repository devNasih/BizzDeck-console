import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1180px" } },
    extend: {
      colors: {
        bd: {
          bg: "hsl(150 20% 98%)",
          ink: "hsl(185 80% 10%)",
          inkSoft: "hsl(185 30% 40%)",
          teal: "hsl(185 100% 15%)",
          tealDeep: "hsl(185 100% 9%)",
          mint: "hsl(150 100% 80%)",
          mintMuted: "hsl(150 40% 92%)",
          border: "hsl(185 20% 90%)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif"],
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
  plugins: [require("tailwindcss-animate")],
};
export default config;
