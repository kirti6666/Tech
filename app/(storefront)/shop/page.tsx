import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import {
  parseCatalogueParams,
  queryCatalogue,
  hasActiveFilters,
  type RawSearchParams,
} from "@/lib/catalogue";
import { getTaxonomy } from "@/lib/taxonomy";
import { CatalogueShell } from "@/components/storefront/catalogue/CatalogueShell";
import { ProductGrid } from "@/components/storefront/catalogue/ProductGrid";
import { Pagination } from "@/components/storefront/catalogue/Pagination";

export const dynamic = "force-dynamic";

/**
 * Filtered views are near-duplicates of /shop as far as a crawler is
 * concerned, so only the unfiltered page is indexable. The industry and
 * technology landing pages are the canonical filtered surfaces — they have
 * their own copy and their own titles, which is what makes them worth
 * indexing when `?tech=react` is not.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const params = parseCatalogueParams(searchParams);
  return {
    title: "Ready-made software products with full source code | TechBro",
    description:
      "Browse production-ready web and mobile applications by industry and technology stack. Every purchase includes complete source code, documentation and installation support.",
    robots: hasActiveFilters(params) ? { index: false, follow: true } : undefined,
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  await connectDB();

  const params = parseCatalogueParams(searchParams);
  const [{ industries, technologies, labels }, result] = await Promise.all([
    getTaxonomy(),
    queryCatalogue(params),
  ]);

  return (
    <main className="mx-auto max-w-shell px-3 py-3 sm:px-6 sm:py-8">
      <CatalogueShell
        industries={industries}
        technologies={technologies}
        params={params}
        total={result.total}
        labels={labels}
      >
        <ProductGrid products={result.products} basePath="/shop" />
        <Pagination
          basePath="/shop"
          params={params}
          totalPages={result.totalPages}
        />
      </CatalogueShell>
    </main>
  );
}
