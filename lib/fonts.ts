import { Inter, Manrope, Playfair_Display } from "next/font/google";

/**
 * Two families, clearly divided.
 *
 * Cormorant Garamond is a high-contrast display serif — the thin strokes
 * that make it elegant at 40px make it fragile at 14px, where they thin out
 * to nearly nothing on a standard screen. So it is restricted to headings of
 * 20px and above, and to the logo. Everything smaller — card titles, table
 * headers, buttons, labels, form fields — is Inter 600, which holds up.
 *
 * The 300 weight is loaded for large headings only: Cormorant at 300 and
 * 48px reads as expensive, at 400 it reads as a book.
 *
 * Numerals use Inter with tabular figures rather than a monospace face.
 * Monospace is kept for the few places it means something — licence keys and
 * demo credentials — using the system stack so it costs no extra download.
 */

export const displayFont = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const brandFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-brand",
  display: "swap",
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${brandFont.variable}`;
