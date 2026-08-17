import Link from "next/link";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import License from "@/models/License";
import { formatPrice } from "@/lib/price";
import { PLATFORM_LABELS, type Platform } from "@/types/catalog";
import { ProductActions } from "@/components/admin/ProductActions";

export const dynamic = "force-dynamic";

/** Product catalogue management and publishing status. */
export default async function AdminProductsPage() {
  await connectDB();

  const [products, soldCounts] = await Promise.all([
    Product.find({})
      .select(
        "title slug status price discountPrice platform provenance provenanceDocKey updatedAt industry"
      )
      .populate("industry", "name")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    License.aggregate([{ $group: { _id: "$product", n: { $sum: 1 } } }]),
  ]);

  const sold = new Map(
    (soldCounts as { _id: unknown; n: number }[]).map((row) => [
      String(row._id),
      row.n,
    ])
  );

  const rows = JSON.parse(JSON.stringify(products)) as {
    _id: string;
    title: string;
    status: "draft" | "published";
    price: number;
    discountPrice?: number;
    platform: Platform;
    provenance: string;
    provenanceDocKey?: string;
    industry?: { name: string };
  }[];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Catalogue</p>
          <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
            Products
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </header>

      <div className="card overflow-x-auto">
        <table className="min-w-[46rem] w-full text-sm">
          <thead>
            <tr className="bg-paper-alt text-left">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                Product
              </th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                Price
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                Sold
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const missingDocs =
                product.provenance !== "in_house" && !product.provenanceDocKey;

              return (
                <tr key={product._id} className="border-t border-rule-soft">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="font-medium text-ink hover:text-accent-deep"
                    >
                      {product.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {product.industry?.name} ·{" "}
                      {PLATFORM_LABELS[product.platform]}
                    </p>
                    {missingDocs && (
                      <p className="mt-1 text-xs text-amber-700">
                        Right-to-resell documentation missing
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        product.status === "published" ? "chip" : "chip-neutral"
                      }
                    >
                      {product.status === "published" ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular text-ink">
                    {formatPrice(product.discountPrice || product.price)}
                  </td>
                  <td className="px-5 py-3 text-right tabular text-ink-soft">
                    {sold.get(product._id) ?? 0}
                  </td>
                  <td className="px-5 py-3"><ProductActions productId={product._id} productTitle={product.title} soldCount={sold.get(product._id) ?? 0} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-ink-faint">
            No products yet. Create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
