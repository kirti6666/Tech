import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Industry from "@/models/Industry";
import {
  parseCatalogueParams,
  queryCatalogue,
  type RawSearchParams,
} from "@/lib/catalogue";
import { getTaxonomy } from "@/lib/taxonomy";
import { CatalogueShell } from "@/components/storefront/catalogue/CatalogueShell";
import { ProductGrid } from "@/components/storefront/catalogue/ProductGrid";
import { Pagination } from "@/components/storefront/catalogue/Pagination";

export const dynamic = "force-dynamic";

/**
 * /industry/fintech — the canonical filtered view.
 *
 * Deliberately not a redirect to /shop?industry=fintech: this page carries
 * its own title, description and intro copy, which is the whole reason it
 * ranks. The industry facet is locked (hidden from the filter panel and not
 * overridable from the query string) so the URL and the results can never
 * disagree.
 */

async function getIndustry(slug: string) {
  await connectDB();
  const doc = await Industry.findOne({ slug, isActive: true }).lean();
  return doc ? (JSON.parse(JSON.stringify(doc)) as {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    productCount: number;
    seo?: { metaTitle?: string; metaDescription?: string };
  }) : null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const industry = await getIndustry(params.slug);
  if (!industry) return { title: "Industry not found | TechBro" };

  return {
    title:
      industry.seo?.metaTitle ||
      `${industry.name} software with source code | TechBro`,
    description:
      industry.seo?.metaDescription ||
      industry.description ||
      `Ready-made ${industry.name.toLowerCase()} applications with complete source code, documentation and setup support.`,
    alternates: { canonical: `/industry/${industry.slug}` },
  };
}

export default async function IndustryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: RawSearchParams;
}) {
  const industry = await getIndustry(params.slug);
  if (!industry) notFound();

  const catalogueParams = parseCatalogueParams(searchParams);
  const [{ industries, technologies, labels }, result] = await Promise.all([
    getTaxonomy(),
    queryCatalogue(catalogueParams, { lockIndustry: industry.slug }),
  ]);

  const basePath = `/industry/${industry.slug}`;

  return (
    <main className="mx-auto max-w-shell px-5 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="label-muted">Industry</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {industry.name} software
        </h1>
        {industry.description && (
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            {industry.description}
          </p>
        )}
      </header>

      <CatalogueShell
        industries={industries}
        technologies={technologies}
        params={{ ...catalogueParams, industry: industry.slug }}
        total={result.total}
        labels={labels}
        locked={{ industry: true }}
      >
        <ProductGrid products={result.products} basePath={basePath} />
        <Pagination
          basePath={basePath}
          params={catalogueParams}
          totalPages={result.totalPages}
        />
      </CatalogueShell>
    </main>
  );
}
