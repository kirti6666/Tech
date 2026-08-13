import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Technology from "@/models/Technology";
import {
  parseCatalogueParams,
  queryCatalogue,
  type RawSearchParams,
} from "@/lib/catalogue";
import { getTaxonomy } from "@/lib/taxonomy";
import { TECH_CATEGORY_LABELS, type TechCategory } from "@/types/catalog";
import { CatalogueShell } from "@/components/storefront/catalogue/CatalogueShell";
import { ProductGrid } from "@/components/storefront/catalogue/ProductGrid";
import { Pagination } from "@/components/storefront/catalogue/Pagination";

export const dynamic = "force-dynamic";

/** /technology/react — same shape as the industry page, tech facet locked. */

async function getTechnology(slug: string) {
  await connectDB();
  const doc = await Technology.findOne({ slug, isActive: true }).lean();
  return doc
    ? (JSON.parse(JSON.stringify(doc)) as {
        _id: string;
        name: string;
        slug: string;
        category: TechCategory;
        description?: string;
        productCount: number;
        seo?: { metaTitle?: string; metaDescription?: string };
      })
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tech = await getTechnology(params.slug);
  if (!tech) return { title: "Technology not found | TechBro" };

  return {
    title:
      tech.seo?.metaTitle || `${tech.name} applications with source code | TechBro`,
    description:
      tech.seo?.metaDescription ||
      tech.description ||
      `Ready-made applications built with ${tech.name}. Complete source code, documentation and setup support included.`,
    alternates: { canonical: `/technology/${tech.slug}` },
  };
}

export default async function TechnologyPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: RawSearchParams;
}) {
  const tech = await getTechnology(params.slug);
  if (!tech) notFound();

  const catalogueParams = parseCatalogueParams(searchParams);
  const [{ industries, technologies, labels }, result] = await Promise.all([
    getTaxonomy(),
    queryCatalogue(catalogueParams, { lockTech: tech.slug }),
  ]);

  const basePath = `/technology/${tech.slug}`;

  return (
    <main className="mx-auto max-w-shell px-5 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="label-muted">{TECH_CATEGORY_LABELS[tech.category]}</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Built with {tech.name}
        </h1>
        {tech.description && (
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            {tech.description}
          </p>
        )}
      </header>

      <CatalogueShell
        industries={industries}
        technologies={technologies}
        params={{ ...catalogueParams, tech: [tech.slug] }}
        total={result.total}
        labels={labels}
        locked={{ tech: true }}
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
