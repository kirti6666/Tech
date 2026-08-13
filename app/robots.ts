import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

/**
 * Served at /robots.txt.
 *
 * `/shop?` is disallowed so filtered catalogue URLs stay out of the index —
 * they duplicate the industry and technology landing pages, which have their
 * own copy and are the versions worth ranking. The pages themselves also
 * send noindex; this saves crawl budget before the request is made.
 *
 * Everything under /account and /admin is private, and /api returns JSON
 * that has no business in search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/account",
        "/checkout",
        "/cart",
        "/order-success",
        "/shop?",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
