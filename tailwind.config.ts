import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import { THEMES } from "./app/DesignSystem/theme";

export default {
  darkMode: "class", // IMPORTANT: enables Tailwind's dark: variants via .dark on <html>
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Theme classes
    ...THEMES.map((theme) => `[data-theme='${theme}']`),
    // Critical utility classes
    {
      pattern: /(bg|text)-(primary|base|neutral|accent)(-content)?/,
    },
    // Theme loading state
    "theme-loading",
  ],
  blocklist: ["[-:T]"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--gaia-font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--gaia-font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        surface: "var(--gaia-surface)",
        "surface-soft": "var(--gaia-surface-soft)",
        border: "var(--gaia-border)",
        foreground: "var(--gaia-foreground)",
        "text-default": "var(--gaia-text-default)",
        "text-strong": "var(--gaia-text-strong)",
        muted: "var(--gaia-text-muted)",
        contrast: "var(--gaia-contrast-bg)",
        "contrast-text": "var(--gaia-contrast-text)",
        positive: "var(--gaia-positive)",
        negative: "var(--gaia-negative)",
        warning: "var(--gaia-warning)",
        info: "var(--gaia-info)",
      },
    },
  },
  plugins: [
    typography({
      className: "prose",
      target: "modern",
    }),
  ],
} satisfies Config;
