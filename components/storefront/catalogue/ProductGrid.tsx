import Link from "next/link";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { CatalogueProduct } from "@/lib/catalogue";

/**
 * Empty state is an instruction, not an apology. "No products found" tells
 * the buyer nothing they didn't already know from the empty screen — the
 * useful information is which filter to loosen and how to get back to
 * everything in one click.
 */
export function ProductGrid({
  products,
  basePath,
}: {
  products: CatalogueProduct[];
  basePath: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule-lavender bg-paper-alt px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Nothing matches all of those filters
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Try removing a technology or widening the price range. If you need
          something specific that isn&apos;t listed, we build to order.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={basePath}
            className="btn-primary"
          >
            Clear filters
          </Link>
          <Link
            href="/contact?type=custom"
            className="btn-secondary"
          >
            Request a custom build
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
