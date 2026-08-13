import Industry from "@/models/Industry";
import Technology from "@/models/Technology";
import type { TechCategory } from "@/types/catalog";

export interface TaxonomyItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface TechItem extends TaxonomyItem {
  category: TechCategory;
}

/**
 * Loads the facet lists every catalogue surface needs, plus slug→name maps
 * so the active-filter chips can render "React" rather than "react".
 *
 * Only tags with at least one published product are offered. A facet that
 * always returns zero results is a dead end the buyer has to discover by
 * clicking it.
 */
export async function getTaxonomy(): Promise<{
  industries: TaxonomyItem[];
  technologies: TechItem[];
  labels: {
    industries: Record<string, string>;
    technologies: Record<string, string>;
  };
}> {
  const [industryDocs, techDocs] = await Promise.all([
    Industry.find({ isActive: true, productCount: { $gt: 0 } })
      .select("name slug productCount")
      .sort({ displayOrder: 1, name: 1 })
      .lean(),
    Technology.find({ isActive: true, productCount: { $gt: 0 } })
      .select("name slug productCount category")
      .sort({ displayOrder: 1, name: 1 })
      .lean(),
  ]);

  const industries = JSON.parse(JSON.stringify(industryDocs)) as TaxonomyItem[];
  const technologies = JSON.parse(JSON.stringify(techDocs)) as TechItem[];

  return {
    industries,
    technologies,
    labels: {
      industries: Object.fromEntries(industries.map((i) => [i.slug, i.name])),
      technologies: Object.fromEntries(technologies.map((t) => [t.slug, t.name])),
    },
  };
}
