/**
 * Site-wide structured data, rendered once in the storefront layout.
 *
 * Organization tells search engines who is behind the site, which matters
 * disproportionately when you are asking strangers to send you five-figure
 * payments. WebSite with a SearchAction lets Google show a search box for
 * the site in results.
 *
 * Nothing here is aspirational. No aggregateRating, no fabricated review
 * count, no awards. Emitting rating markup with nothing behind it is the
 * fabricated-testimonial problem in machine-readable form — Google penalises
 * it, and the compliance notes rule it out anyway.
 *
 * PLACEHOLDERS: replace the phone number and social profiles with real ones,
 * or delete those keys. A `sameAs` pointing at an empty profile is worse
 * than omitting it.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

export function SiteStructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TechBro",
    legalName: "Geoloide Private Limited",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Ready-made software products sold with complete source code, documentation and setup support.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "hello@techbro.in",
      availableLanguage: ["English", "Hindi"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TechBro",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([organization, website]),
      }}
    />
  );
}
