import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        "agent-red":   "hsl(var(--agent-red))",
        "agent-amber": "hsl(var(--agent-amber))",
        "agent-blue":  "hsl(var(--agent-blue))",
        "agent-green": "hsl(var(--agent-green))",
      },
      fontFamily: {
        mono:    ["var(--font-mono)", "IBM Plex Mono", "monospace"],
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        full: "9999px",
      },
      keyframes: {
        "crash-in-left": {
          from: { transform: "translateX(-100vw)" },
          to:   { transform: "translateX(0)" },
        },
        "snap-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "snap-in": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "60%":  { opacity: "1", transform: "translateY(-2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-simple": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        "red-wipe": {
          from: { clipPath: "inset(0 0 0 100%)" },
          to:   { clipPath: "inset(0 0 0 0)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { opacity: "0.2", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "crash-in-left":  "crash-in-left 0.6s ease-out forwards",
        "snap-up":        "snap-up 0.3s ease-out forwards",
        "snap-in":        "snap-in 0.3s ease-out forwards",
        "fade-in-simple": "fade-in-simple 0.4s ease-out forwards",
        "cursor-blink":   "cursor-blink 0.6s step-end infinite",
        "slide-in-left":  "slide-in-left 0.15s ease-out forwards",
        "pulse-dot":      "pulse-dot 1.5s ease-in-out 2",
        "red-wipe":       "red-wipe 0.4s ease-out forwards",
        "typing-dot":     "typing-dot 1.2s ease-in-out infinite",
        shimmer:          "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
