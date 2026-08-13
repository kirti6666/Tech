import Link from "next/link";
import { PLATFORM_LABELS } from "@/types/catalog";
import { formatPrice, discountPercent } from "@/lib/price";
import type { CatalogueProduct } from "@/lib/catalogue";

/**
 * Card as datasheet header: title, one line of what it is, then the
 * measurable facts in mono. No shadow, no fill — a hairline rule and a
 * accent-deep-blue edge on hover. The screenshot is 16:10 because these are
 * dashboards and admin panels, and a square crop decapitates every one of
 * them.
 *
 * The tech chips are anchors, not buttons: a buyer scanning for "Flutter"
 * should be able to click straight through to the filtered catalogue, and
 * search engines should be able to follow the same path.
 */

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const saving = discountPercent(product.price, product.discountPrice);
  const image = product.thumbnail || product.images?.[0];
  // Four chips fit on one line at the narrowest card width; past that the
  // row wraps and the cards in a grid row stop lining up.
  const chips = product.techStack.slice(0, 4);
  const overflow = product.techStack.length - chips.length;

  return (
    <article className="group relative flex flex-col overflow-hidden card-interactive">
      <Link
        href={`/product/${product.slug}`}
        className="block focus:outline-none"
        aria-label={product.title}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-alt">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center label-muted">
              No preview
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-md bg-paper/95 px-2.5 py-1 text-label font-medium uppercase tracking-[0.06em] text-ink-soft shadow-card backdrop-blur">
            {PLATFORM_LABELS[product.platform]}
          </span>
          {saving !== null && (
            <span className="absolute right-3 top-3 rounded-md bg-save px-2.5 py-1 text-label font-medium uppercase tracking-[0.06em] text-white shadow-card">
              Save {saving}%
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {product.industry && (
            <p className="label-muted">{product.industry.name}</p>
          )}
          <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink">
            {/* Stretched link: the whole card is clickable, but the chips
                below sit above it in the stacking order and stay separately
                clickable. */}
            <Link
              href={`/product/${product.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {product.title}
            </Link>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {product.shortDescription}
          </p>
        </div>

        {chips.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-1">
            {chips.map((tech) => (
              <Link
                key={tech._id}
                href={`/technology/${tech.slug}`}
                className="chip-link"
              >
                {tech.name}
              </Link>
            ))}
            {overflow > 0 && (
              <span className="chip border-dashed">+{overflow}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 border-t border-rule-soft pt-3">
          <span className="tabular text-lg font-medium text-ink tabular">
            {formatPrice(product.effectivePrice)}
          </span>
          {saving !== null && (
            <span className="tabular text-sm text-ink-faint line-through tabular">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
