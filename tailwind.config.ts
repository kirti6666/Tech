import type { Config } from "tailwindcss";

/**
 * Design direction: premium, white-dominant, midnight blue with gold details.
 *
 * White carries most screens, navy provides readable type and strong actions,
 * and gold is reserved for premium emphasis. Pale blue separates panels by
 * tone without making the interface feel busy.
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
          DEFAULT: "#081A3A",
          soft: "#40506A",
          faint: "#66758D",
          ghost: "#98A4B7",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          alt: "#F7FAFF",
          deep: "#EAF2FC",
        },
        rule: {
          DEFAULT: "#DCE6F3",
          soft: "#EEF4FA",
          lavender: "#C8D8EC",
        },
        accent: {
          DEFAULT: "#123B78",
          deep: "#071A3D",
          hover: "#0D2F64",
          wash: "#E8F1FF",
          mist: "#F3F7FD",
        },
        gold: {
          DEFAULT: "#F5B800",
          deep: "#996300",
          soft: "#FFF1B8",
          pale: "#FFFAE8",
        },
        save: "#059669",
        warn: "#B45309",
      },
      fontFamily: {
        brand: ["var(--font-brand)", "Georgia", "serif"],
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
        card: "0 1px 2px rgba(8,26,58,0.03), 0 12px 34px -22px rgba(8,26,58,0.22)",
        lift: "0 8px 34px -18px rgba(8,26,58,0.24)",
        accent: "0 10px 28px -12px rgba(7,26,61,0.50)",
      },
      backgroundImage: {
        "lavender-fade": "linear-gradient(180deg, #F2F6FB 0%, #FFFFFF 100%)",
        "lavender-soft": "linear-gradient(135deg, #F6F8FC 0%, #E7EEF8 100%)",
        "accent-cta": "linear-gradient(135deg, #123B78 0%, #071A3D 100%)",
      },
      maxWidth: { shell: "78rem" },
    },
  },
  plugins: [],
};

export default config;
