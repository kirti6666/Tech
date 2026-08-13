import type { Config } from "tailwindcss";

/**
 * Design direction: premium, white-dominant, lavender-tinted.
 *
 * White carries roughly 70% of every screen. Lavender does the work borders
 * used to — panel headers, section grounds, hover states — so the interface
 * separates by tone rather than by lines. Purple appears only on things you
 * can act on.
 *
 * TWO PURPLES, DELIBERATELY:
 *   accent      #8B5CF6 — fills, buttons, large elements
 *   accent-deep #6D28D9 — links, small text, icons
 *
 * #8B5CF6 on white measures about 3.4:1, which fails WCAG AA for body text.
 * On a 13px label it would look right to a designer on a good monitor and be
 * unreadable to a customer with mild low vision. #6D28D9 measures about
 * 6.5:1 and passes comfortably. Rule of thumb: `accent` when the purple IS
 * the background, `accent-deep` when the purple is the text.
 */

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        ink: {
          DEFAULT: "#18181B",
          soft: "#52525B",
          faint: "#71717A",
          ghost: "#A1A1AA",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F3FF",
          deep: "#EDE9FE",
        },
        rule: {
          DEFAULT: "#E4E4E7",
          soft: "#F4F4F5",
          lavender: "#DDD6FE",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          deep: "#6D28D9",
          hover: "#7C3AED",
          wash: "#EDE9FE",
          mist: "#F5F3FF",
        },
        save: "#059669",
        warn: "#B45309",
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        label: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(24,24,27,0.04), 0 8px 24px -12px rgba(24,24,27,0.10)",
        lift: "0 2px 4px rgba(24,24,27,0.04), 0 16px 40px -16px rgba(109,40,217,0.18)",
        accent: "0 8px 24px -10px rgba(139,92,246,0.45)",
      },
      backgroundImage: {
        "lavender-fade": "linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)",
        "lavender-soft": "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
        "accent-cta": "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      },
      maxWidth: { shell: "78rem" },
    },
  },
  plugins: [],
};

export default config;
