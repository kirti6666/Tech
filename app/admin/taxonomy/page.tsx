import { connectDB } from "@/lib/db";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomyPage() {
  await connectDB();

  const [industryDocs, techDocs] = await Promise.all([
    Industry.find({}).sort({ displayOrder: 1, name: 1 }).lean(),
    Technology.find({}).sort({ category: 1, displayOrder: 1, name: 1 }).lean(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <p className="label">Catalogue</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Industries &amp; technologies
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          These drive the catalogue filters, the chips on every product card,
          and the landing pages that bring in search traffic. Counts update
          when a product is published or unpublished.
        </p>
      </header>

      <TaxonomyManager
        industries={JSON.parse(JSON.stringify(industryDocs))}
        technologies={JSON.parse(JSON.stringify(techDocs))}
      />
    </div>
  );
}
