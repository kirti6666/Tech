import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";
import License from "@/models/License";
import { ProductForm, type ProductDraft } from "@/components/admin/ProductForm";
import type { LicenseProvenance, Platform, TechCategory } from "@/types/catalog";

export const dynamic = "force-dynamic";

/**
 * Serves both /admin/products/new and /admin/products/[id]. One form, one
 * set of validation rules — a separate "create" screen is how the two drift
 * until a field exists on one and not the other.
 *
 * `included` is pre-filled on new products because those five lines are the
 * same on every product you sell, and an empty list is how a listing ships
 * without them.
 */

const BLANK: ProductDraft = {
  title: "",
  shortDescription: "",
  description: "",
  images: [],
  thumbnail: "",
  industry: "",
  techStack: [],
  platform: "",
  price: "",
  discountPrice: "",
  packages: [],
  sacCode: "997331",
  gstRate: 18,
  features: [],
  included: [
    "Complete source code",
    "Database schema and sample data",
    "Installation guide",
    "Technical documentation",
    "30 days of installation support",
  ],
  demo: {
    webUrl: "",
    adminUrl: "",
    adminUser: "",
    adminPass: "",
    appStoreUrl: "",
    playStoreUrl: "",
    workflowVideoUrl: "",
  },
  requirements: { server: "", language: "", database: "" },
  documentationUrl: "",
  githubRepo: "",
  provenance: "in_house",
  provenanceDocKey: "",
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
  isFeatured: false,
  status: "draft",
};

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();

  const [industries, technologies] = await Promise.all([
    Industry.find({}).select("name slug").sort({ displayOrder: 1 }).lean(),
    Technology.find({})
      .select("name slug category")
      .sort({ displayOrder: 1 })
      .lean(),
  ]);

  const isNew = params.id === "new";
  let draft = BLANK;
  let licenseCount = 0;

  if (!isNew) {
    const [doc, count] = await Promise.all([
      Product.findById(params.id).lean(),
      License.countDocuments({ product: params.id }),
    ]);
    if (!doc) notFound();

    const p = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
    licenseCount = count;

    draft = {
      ...BLANK,
      ...p,
      _id: String(p._id),
      industry: p.industry ? String(p.industry) : "",
      techStack: ((p.techStack as unknown[]) ?? []).map(String),
      platform: (p.platform as Platform) ?? "",
      price: (p.price as number) ?? "",
      discountPrice: (p.discountPrice as number) ?? "",
      provenance: (p.provenance as LicenseProvenance) ?? "in_house",
      provenanceDocKey: (p.provenanceDocKey as string) ?? "",
      documentationUrl: (p.documentationUrl as string) ?? "",
      githubRepo: (p.githubRepo as string) ?? "",
      demo: { ...BLANK.demo, ...((p.demo as object) ?? {}) },
      requirements: {
        ...BLANK.requirements,
        ...((p.requirements as object) ?? {}),
      },
      seo: { ...BLANK.seo, ...((p.seo as object) ?? {}) },
    } as ProductDraft;
  }

  return (
    <div>
      <header className="mb-6">
        <Link href="/admin/products" className="label text-xs hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink">
          {isNew ? "New product" : draft.title || "Untitled"}
        </h1>
      </header>

      <ProductForm
        initial={draft}
        licenseCount={licenseCount}
        industries={JSON.parse(JSON.stringify(industries))}
        technologies={
          JSON.parse(JSON.stringify(technologies)) as {
            _id: string;
            name: string;
            slug: string;
            category: TechCategory;
          }[]
        }
      />
    </div>
  );
}
