import "server-only";

import type { PipelineStage } from "mongoose";
import Product from "@/models/Product";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";
import {
  PLATFORMS,
  SORT_OPTIONS,
  type Platform,
  type SortValue,
} from "@/types/catalog";

/**
 * One query builder for every listing surface: /shop, /industry/[slug],
 * /technology/[slug], and GET /api/products. They differ only in which
 * filter is pre-applied and locked, so they should not each grow their own
 * copy of the sort map and the pagination arithmetic.
 *
 * Implemented as an aggregation rather than find() for one specific reason:
 * sorting by price has to sort by the price actually charged. A find()
 * sorted on `price` puts a ₹75,000 product discounted to ₹59,999 above a
 * ₹64,999 one, and the customer sees a "low to high" list that isn't. The
 * pipeline derives `effectivePrice` first and sorts and range-filters on
 * that.
 */

export const PAGE_SIZE = 12;

export interface CatalogueParams {
  q?: string;
  industry?: string;
  tech: string[];
  platform: Platform[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortValue;
  page: number;
}

/** Raw Next.js searchParams — values may be string, string[] or undefined. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

/**
 * Multi-value params are comma-separated (`?tech=react,nodejs`) rather than
 * repeated keys. Shorter, and it survives a copy-paste out of the address
 * bar into a chat window, which is how these links actually get shared.
 */
function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : value;
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseCatalogueParams(raw: RawSearchParams): CatalogueParams {
  const sortRaw = first(raw.sort) as SortValue | undefined;
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortValue)
    : "newest";

  const minPrice = toNumber(first(raw.min));
  const maxPrice = toNumber(first(raw.max));

  return {
    q: first(raw.q),
    industry: first(raw.industry)?.toLowerCase(),
    tech: list(raw.tech),
    platform: list(raw.platform).filter((p): p is Platform =>
      (PLATFORMS as readonly string[]).includes(p)
    ),
    // Swap them rather than returning nothing — a reversed range is a
    // fat-fingered URL, not a request for an empty page.
    minPrice:
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? maxPrice
        : minPrice,
    maxPrice:
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? minPrice
        : maxPrice,
    sort,
    page: Math.max(1, Number(first(raw.page) ?? 1) || 1),
  };
}

/** Rebuilds a catalogue URL with one facet changed. Always resets to page 1. */
export function buildCatalogueUrl(
  basePath: string,
  params: CatalogueParams,
  overrides: Partial<CatalogueParams> & { page?: number }
): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();

  if (merged.q) search.set("q", merged.q);
  if (merged.industry) search.set("industry", merged.industry);
  if (merged.tech.length) search.set("tech", merged.tech.join(","));
  if (merged.platform.length) search.set("platform", merged.platform.join(","));
  if (merged.minPrice !== undefined) search.set("min", String(merged.minPrice));
  if (merged.maxPrice !== undefined) search.set("max", String(merged.maxPrice));
  if (merged.sort !== "newest") search.set("sort", merged.sort);
  if (overrides.page && overrides.page > 1) search.set("page", String(overrides.page));

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export interface CatalogueProduct {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  images: string[];
  thumbnail?: string;
  platform: Platform;
  price: number;
  discountPrice?: number;
  effectivePrice: number;
  industry: { _id: string; name: string; slug: string } | null;
  techStack: { _id: string; name: string; slug: string; category: string }[];
  createdAt: string;
}

export interface CatalogueResult {
  products: CatalogueProduct[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * `lockIndustry` / `lockTech` are for the SEO landing pages, where the facet
 * comes from the route rather than the query string and must not be
 * overridable by a hand-edited URL.
 */
export async function queryCatalogue(
  params: CatalogueParams,
  opts: { lockIndustry?: string; lockTech?: string } = {}
): Promise<CatalogueResult> {
  const industrySlug = opts.lockIndustry ?? params.industry;
  const techSlugs = opts.lockTech ? [opts.lockTech] : params.tech;

  const [industryDoc, techDocs] = await Promise.all([
    industrySlug
      ? Industry.findOne({ slug: industrySlug }).select("_id").lean()
      : null,
    techSlugs.length
      ? Technology.find({ slug: { $in: techSlugs } }).select("_id").lean()
      : [],
  ]);

  // A slug that matches nothing must return nothing, not everything. Silently
  // dropping an unresolvable filter is how a 404-worthy URL ends up serving
  // the full catalogue.
  if (industrySlug && !industryDoc) {
    return { products: [], total: 0, page: params.page, totalPages: 0 };
  }
  if (techSlugs.length && (techDocs as unknown[]).length === 0) {
    return { products: [], total: 0, page: params.page, totalPages: 0 };
  }

  const match: Record<string, unknown> = { status: "published" };

  if (params.q) match.$text = { $search: params.q };
  if (industryDoc) match.industry = (industryDoc as { _id: unknown })._id;
  if ((techDocs as { _id: unknown }[]).length) {
    // OR within the facet: ticking React and Vue means "either", matching how
    // every other faceted catalogue behaves. If you decide buyers really mean
    // "a stack containing all of these", change $in to $all — but change the
    // filter heading too, because the two readings are not interchangeable.
    match.techStack = { $in: (techDocs as { _id: unknown }[]).map((t) => t._id) };
  }
  if (params.platform.length) match.platform = { $in: params.platform };

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            { $gt: [{ $ifNull: ["$discountPrice", 0] }, 0] },
            "$discountPrice",
            "$price",
          ],
        },
      },
    },
  ];

  const priceMatch: Record<string, number> = {};
  if (params.minPrice !== undefined) priceMatch.$gte = params.minPrice;
  if (params.maxPrice !== undefined) priceMatch.$lte = params.maxPrice;
  if (Object.keys(priceMatch).length) {
    pipeline.push({ $match: { effectivePrice: priceMatch } });
  }

  const sortStage: Record<string, 1 | -1> =
    params.sort === "price_asc"
      ? { effectivePrice: 1, _id: 1 }
      : params.sort === "price_desc"
        ? { effectivePrice: -1, _id: 1 }
        : { createdAt: -1, _id: 1 };

  pipeline.push({
    $facet: {
      items: [
        { $sort: sortStage },
        { $skip: (params.page - 1) * PAGE_SIZE },
        { $limit: PAGE_SIZE },
        {
          $lookup: {
            from: "industries",
            localField: "industry",
            foreignField: "_id",
            as: "industry",
            pipeline: [{ $project: { name: 1, slug: 1 } }],
          },
        },
        {
          $lookup: {
            from: "technologies",
            localField: "techStack",
            foreignField: "_id",
            as: "techStack",
            pipeline: [
              { $project: { name: 1, slug: 1, category: 1, displayOrder: 1 } },
              { $sort: { displayOrder: 1 } },
            ],
          },
        },
        { $unwind: { path: "$industry", preserveNullAndEmptyArrays: true } },
        {
          // Whitelist, not a blacklist: sourceFileKey and githubRepo must
          // never reach a listing response, and an allow-list means a new
          // private field is excluded by default.
          $project: {
            title: 1,
            slug: 1,
            shortDescription: 1,
            images: 1,
            thumbnail: 1,
            platform: 1,
            price: 1,
            discountPrice: 1,
            effectivePrice: 1,
            industry: 1,
            techStack: 1,
            createdAt: 1,
          },
        },
      ],
      total: [{ $count: "n" }],
    },
  });

  const [result] = await Product.aggregate(pipeline);
  const items = (result?.items ?? []) as CatalogueProduct[];
  const total = (result?.total?.[0]?.n ?? 0) as number;

  return {
    products: JSON.parse(JSON.stringify(items)) as CatalogueProduct[],
    total,
    page: params.page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

/** True when anything beyond the default sort is applied — drives "Clear all". */
export function hasActiveFilters(params: CatalogueParams): boolean {
  return Boolean(
    params.q ||
      params.industry ||
      params.tech.length ||
      params.platform.length ||
      params.minPrice !== undefined ||
      params.maxPrice !== undefined
  );
}
