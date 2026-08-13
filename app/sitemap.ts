import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";

/**
 * Served at /sitemap.xml.
 *
 * Rewritten from the retail version, which listed /category/[slug] — a route
 * that no longer exists — and filtered products on `isActive`, a field the
 * digital Product model doesn't have. Left alone it would have submitted a
 * sitemap of 404s, which is a slow, quiet way to lose ranking.
 *
 * Landing pages with no products are excluded. An indexed page that renders
 * an empty grid is a thin-content signal and a dead end for anyone who
 * clicks it from search.
 *
 * Login, register and checkout are deliberately absent — nothing is gained
 * by indexing them and robots.txt blocks the last one anyway.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1, frequency: "daily" as const },
    { path: "/shop", priority: 0.9, frequency: "daily" as const },
    { path: "/about", priority: 0.5, frequency: "monthly" as const },
    { path: "/faq", priority: 0.6, frequency: "monthly" as const },
    { path: "/contact", priority: 0.6, frequency: "monthly" as const },
    { path: "/licence", priority: 0.4, frequency: "yearly" as const },
    { path: "/refund-policy", priority: 0.4, frequency: "yearly" as const },
    { path: "/terms", priority: 0.3, frequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, frequency: "yearly" as const },
  ].map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.frequency,
    priority: route.priority,
  }));

  try {
    await connectDB();

    const [products, industries, technologies] = await Promise.all([
      Product.find({ status: "published" }).select("slug updatedAt").lean(),
      Industry.find({ isActive: true, productCount: { $gt: 0 } })
        .select("slug updatedAt")
        .lean(),
      Technology.find({ isActive: true, productCount: { $gt: 0 } })
        .select("slug updatedAt")
        .lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (
      products as unknown as { slug: string; updatedAt?: Date }[]
    ).map((product) => ({
      url: `${BASE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const industryRoutes: MetadataRoute.Sitemap = (
      industries as unknown as { slug: string; updatedAt?: Date }[]
    ).map((industry) => ({
      url: `${BASE_URL}/industry/${industry.slug}`,
      lastModified: industry.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const technologyRoutes: MetadataRoute.Sitemap = (
      technologies as unknown as { slug: string; updatedAt?: Date }[]
    ).map((tech) => ({
      url: `${BASE_URL}/technology/${tech.slug}`,
      lastModified: tech.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...productRoutes,
      ...industryRoutes,
      ...technologyRoutes,
    ];
  } catch (error) {
    // A database hiccup shouldn't serve a broken sitemap. Static routes are
    // better than a 500, which Search Console records as a fetch failure.
    console.error("[sitemap] falling back to static routes:", error);
    return staticRoutes;
  }
}
