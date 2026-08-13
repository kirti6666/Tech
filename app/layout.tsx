import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/storefront/Header";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { SiteStructuredData } from "@/components/storefront/SiteStructuredData";
import { Analytics } from "@/components/Analytics";
import { fontVariables } from "@/lib/fonts";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Root layout.
 *
 * Wires up the pieces the phases produced but couldn't install themselves:
 * the two typefaces, the footer, site-wide structured data and analytics.
 *
 * NOTE ON DATA FETCHING HERE: getSiteSettings() runs on every page,
 * including the static legal pages, which makes the whole site
 * database-dependent at build time. It has its own fallback to defaults, so
 * an outage degrades rather than breaks — but combined with a slow
 * connection timeout it used to hang the build. See the timeout note in
 * lib/db.ts. If this ever becomes a problem, the branding values are stable
 * enough to cache aggressively rather than read per request.
 */

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    // A template means every page gets the brand suffix without each one
    // remembering to add it, and pages that set an absolute title can opt
    // out.
    title: {
      default: settings.seo.metaTitle || settings.brand.storeName,
      template: `%s | ${settings.brand.storeName}`,
    },
    description: settings.seo.metaDescription,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.NEXTAUTH_URL ??
        "http://localhost:3000"
    ),
    icons: settings.brand.faviconUrl
      ? { icon: settings.brand.faviconUrl }
      : undefined,
    openGraph: {
      siteName: settings.brand.storeName,
      type: "website",
      locale: "en_IN",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  // Admin-chosen theme colours, injected as CSS variables. Tailwind's
  // `primary` resolves to these; the lavender palette is fixed in the config.
  const themeVars = `:root{--primary:${settings.theme.primaryColor};--primary-foreground:${settings.theme.primaryForeground};}`;

  return (
    <html lang="en" className={fontVariables}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      </head>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink">
        <SiteStructuredData />
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
